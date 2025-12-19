from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from web3 import Web3
import os
from dotenv import load_dotenv
import json
from sqlalchemy.orm import Session
from database import get_db, Contractor, Project, Milestone
from auth import hash_password, verify_password, create_access_token, verify_token
from typing import List, Optional
import requests

# CORRECTED SUI IMPORTS for pysui 0.65.0
from pysui import SuiConfig, SyncClient
from pysui.sui.sui_crypto import recover_key_and_address
from pysui.sui.sui_txn import SyncTransaction

import tempfile
import shutil
import subprocess
import json as json_lib
from geopy.distance import geodesic
import time
from datetime import datetime, timedelta
load_dotenv()

app = FastAPI(title="Optic-Gov AI Oracle")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-3-flash')

# Configure Web3
w3 = Web3(Web3.HTTPProvider(os.getenv("SEPOLIA_RPC_URL")))
private_key = os.getenv("ETHEREUM_PRIVATE_KEY")
contract_address = os.getenv("CONTRACT_ADDRESS")

# Currency conversion cache
eth_ngn_cache = {"rate": None, "timestamp": None}
CACHE_DURATION = 300  # 5 minutes

def get_sui_client():
    """Initialize SUI client with oracle keypair - CORRECTED for pysui 0.65.0"""
    rpc_url = os.getenv("SUI_RPC_URL")
    mnemonic = os.getenv("SUI_ORACLE_MNEMONIC")
    
    if not mnemonic:
        print("❌ SUI_ORACLE_MNEMONIC not found in .env")
        return None
    
    try:
        # CORRECT: Use recover_key_and_address for pysui 0.65.0
        _, kp, addr_obj = recover_key_and_address(
            keytype=0,  # ED25519
            mnemonics=mnemonic,
            derv_path="m/44'/784'/0'/0'/0'"
        )
        
        print(f"✅ SUI Oracle Address: {addr_obj.address}")
        
        # Initialize config with the recovered keypair
        cfg = SuiConfig.user_config(
            rpc_url=rpc_url,
            prv_keys=[kp.serialize()]
        )
        return SyncClient(cfg)
        
    except Exception as e:
        print(f"❌ Failed to initialize SUI client: {e}")
        return None

# Initialize the client ONCE
sui_client = get_sui_client()

# Verify connections on startup
print(f"Web3 connected: {w3.is_connected()}")
print(f"Contract address: {contract_address}")
print(f"Oracle wallet: {os.getenv('ORACLE_WALLET_ADDRESS')}")
print(f"Gemini API configured: {'YES' if os.getenv('GEMINI_API_KEY') else 'NO'}")
print(f"Database URL: {os.getenv('DATABASE_URL')}")
print(f"SUI Client initialized: {'YES' if sui_client else 'NO'}")

def get_eth_ngn_rate():
    """Get ETH to NGN exchange rate with caching"""
    current_time = time.time()
    
    # Check if cache is valid
    if (eth_ngn_cache["rate"] is not None and 
        eth_ngn_cache["timestamp"] is not None and 
        current_time - eth_ngn_cache["timestamp"] < CACHE_DURATION):
        return eth_ngn_cache["rate"]
    
    try:
        # Get ETH price in USD from CoinGecko
        eth_response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
            timeout=10
        )
        eth_usd = eth_response.json()["ethereum"]["usd"]
        
        # Get USD to NGN rate from exchangerate-api
        usd_ngn_response = requests.get(
            "https://api.exchangerate-api.com/v4/latest/USD",
            timeout=10
        )
        usd_ngn = usd_ngn_response.json()["rates"]["NGN"]
        
        # Calculate ETH to NGN rate
        eth_ngn_rate = eth_usd * usd_ngn
        
        # Update cache
        eth_ngn_cache["rate"] = eth_ngn_rate
        eth_ngn_cache["timestamp"] = current_time
        
        return eth_ngn_rate
        
    except Exception as e:
        print(f"Error fetching exchange rate: {e}")
        # Return cached rate if available, otherwise default
        return eth_ngn_cache["rate"] if eth_ngn_cache["rate"] else 2500000  # Fallback rate

async def release_funds_sui(project_object_id: str, amount_mist: int):
    """
    Trigger Sui contract to release funds - CORRECTED for pysui 0.65.0
    project_object_id: The ID of the 'Project' shared object on-chain
    amount_mist: Amount to release in MIST (1 SUI = 10^9 MIST)
    """
    if not sui_client:
        print("❌ SUI client not initialized")
        return None
    
    try:
        # Use SyncTransaction (high-level API)
        txn = SyncTransaction(client=sui_client)
        
        # Get environment variables
        package_id = os.getenv("SUI_PACKAGE_ID")
        oracle_cap_id = os.getenv("SUI_ORACLE_CAP_ID")
        
        if not package_id or not oracle_cap_id:
            print("❌ Missing SUI_PACKAGE_ID or SUI_ORACLE_CAP_ID")
            return None
        
        # Call the move function: release_payment(OracleCap, Project, u64)
        txn.move_call(
            target=f"{package_id}::optic_gov::release_payment",
            arguments=[
                txn.make_move_object_vec([oracle_cap_id]),  # OracleCap
                txn.make_move_object_vec([project_object_id]),  # Project
                amount_mist  # u64 amount
            ],
            type_arguments=[]
        )
        
        # Execute with gas budget
        result = txn.execute(gas_budget="10000000")
        
        if result.is_ok():
            digest = result.result_data.digest
            print(f"✅ SUI Payout Successful: {digest}")
            return digest
        else:
            error_msg = result.result_string
            print(f"❌ SUI Payout Failed: {error_msg}")
            return None
            
    except Exception as e:
        print(f"❌ SUI transaction failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def convert_ngn_to_eth(ngn_amount: float) -> float:
    """Convert NGN amount to ETH"""
    rate = get_eth_ngn_rate()
    return ngn_amount / rate

def convert_eth_to_ngn(eth_amount: float) -> float:
    """Convert ETH amount to NGN"""
    rate = get_eth_ngn_rate()
    return eth_amount * rate

class ContractorRegister(BaseModel):
    wallet_address: str
    company_name: str
    email: str
    password: str

class ContractorLogin(BaseModel):
    email: str
    password: str

class VerificationRequest(BaseModel):
    video_url: str
    milestone_criteria: str
    project_id: int
    milestone_index: int

class ProjectCreate(BaseModel):
    name: str
    description: str
    total_budget: float
    budget_currency: str = "NGN"  # "NGN" or "ETH"
    contractor_wallet: str
    use_ai_milestones: bool
    manual_milestones: Optional[List[str]] = None
    project_latitude: float
    project_longitude: float
    location_tolerance_km: float = 1.0
    gov_wallet: str
    on_chain_id: int

class MilestoneGenerate(BaseModel):
    project_description: str
    total_budget: float

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_budget: Optional[float] = None
    project_latitude: Optional[float] = None
    project_longitude: Optional[float] = None
    location_tolerance_km: Optional[float] = None

class VerificationResponse(BaseModel):
    verified: bool
    confidence_score: int
    reasoning: str

class CurrencyConversion(BaseModel):
    naira_amount: float
    eth_amount: float
    exchange_rate: float
    timestamp: str

class ConvertRequest(BaseModel):
    amount: float
    from_currency: str  # "NGN" or "ETH"
    to_currency: str    # "NGN" or "ETH"

@app.post("/register")
async def register_contractor(contractor: ContractorRegister, db: Session = Depends(get_db)):
    if db.query(Contractor).filter(Contractor.email == contractor.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(contractor.password)
    db_contractor = Contractor(
        wallet_address=contractor.wallet_address,
        company_name=contractor.company_name,
        email=contractor.email,
        password_hash=hashed_password
    )
    db.add(db_contractor)
    db.commit()
    return {"message": "Contractor registered successfully"}

@app.post("/login")
async def login_contractor(login: ContractorLogin, db: Session = Depends(get_db)):
    contractor = db.query(Contractor).filter(Contractor.email == login.email).first()
    if not contractor or not verify_password(login.password, contractor.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": contractor.wallet_address})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/convert-currency")
async def convert_currency(request: ConvertRequest):
    """Convert between NGN and ETH"""
    try:
        rate = get_eth_ngn_rate()
        
        if request.from_currency.upper() == "NGN" and request.to_currency.upper() == "ETH":
            converted_amount = convert_ngn_to_eth(request.amount)
            return CurrencyConversion(
                naira_amount=request.amount,
                eth_amount=converted_amount,
                exchange_rate=rate,
                timestamp=datetime.now().isoformat()
            )
        elif request.from_currency.upper() == "ETH" and request.to_currency.upper() == "NGN":
            converted_amount = convert_eth_to_ngn(request.amount)
            return CurrencyConversion(
                naira_amount=converted_amount,
                eth_amount=request.amount,
                exchange_rate=rate,
                timestamp=datetime.now().isoformat()
            )
        else:
            raise HTTPException(status_code=400, detail="Only NGN<->ETH conversion supported")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.post("/generate-milestones")
async def generate_milestones(request: MilestoneGenerate):
    try:
        prompt = f"""Generate 4-6 construction milestones for: {request.project_description}
Budget: ${request.total_budget:,.2f}

Return ONLY a JSON array like: ["Foundation excavation", "Concrete pouring", "Steel reinforcement"]"""
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Try to extract JSON from response
        if '[' in response_text and ']' in response_text:
            start = response_text.find('[')
            end = response_text.rfind(']') + 1
            json_text = response_text[start:end]
            milestones = json.loads(json_text)
        else:
            # Fallback milestones if AI fails
            milestones = [
                "Site preparation and excavation",
                "Foundation pouring and curing", 
                "Structural framework installation",
                "Final inspection and cleanup"
            ]
        
        return {"milestones": milestones}
    except Exception as e:
        # Return default milestones if anything fails
        return {"milestones": [
            "Site preparation and excavation",
            "Foundation pouring and curing",
            "Structural framework installation", 
            "Final inspection and cleanup"
        ]}

@app.post("/create-project")
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    contractor = db.query(Contractor).filter(Contractor.wallet_address == project.contractor_wallet).first()
    if not contractor:
        # Auto-create contractor if not exists
        contractor = Contractor(
            wallet_address=project.contractor_wallet,
            company_name=f"Contractor {project.contractor_wallet[:8]}",
            email=f"contractor_{project.contractor_wallet[:8]}@temp.com",
            password_hash="temp_hash"  # Temporary hash
        )
        db.add(contractor)
        db.commit()
        db.refresh(contractor)
    
    # Convert budget to ETH if provided in NGN
    budget_eth = project.total_budget
    budget_ngn = project.total_budget
    
    if project.budget_currency.upper() == "NGN":
        budget_eth = convert_ngn_to_eth(project.total_budget)
    else:
        budget_ngn = convert_eth_to_ngn(project.total_budget)
    
    # Create project (store both NGN and ETH amounts)
    db_project = Project(
        name=project.name,
        description=project.description,
        total_budget=budget_eth,  # Store ETH amount for blockchain
        contractor_id=contractor.id,
        ai_generated=project.use_ai_milestones,
        project_latitude=project.project_latitude,
        project_longitude=project.project_longitude,
        location_tolerance_km=project.location_tolerance_km,
        gov_wallet=project.gov_wallet,
        on_chain_id=project.on_chain_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Create milestones
    if project.use_ai_milestones:
        # Generate AI milestones
        ai_response = await generate_milestones(MilestoneGenerate(
            project_description=project.description,
            total_budget=project.total_budget
        ))
        milestone_descriptions = ai_response["milestones"]
    else:
        milestone_descriptions = project.manual_milestones
    
    # Create milestone records (use ETH amount for milestones)
    milestone_amount = budget_eth / len(milestone_descriptions)
    for i, desc in enumerate(milestone_descriptions):
        milestone = Milestone(
            project_id=db_project.id,
            description=desc,
            amount=milestone_amount,
            order_index=i + 1
        )
        db.add(milestone)
    
    db.commit()
    return {
        "project_id": db_project.id, 
        "milestones_created": len(milestone_descriptions),
        "budget_eth": budget_eth,
        "budget_ngn": budget_ngn,
        "exchange_rate": get_eth_ngn_rate()
    }

@app.get("/projects")
async def get_all_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    
    # Add currency conversion for each project
    projects_with_currency = []
    for project in projects:
        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "total_budget_eth": project.total_budget,
            "total_budget_ngn": convert_eth_to_ngn(project.total_budget),
            "contractor_id": project.contractor_id,
            "ai_generated": project.ai_generated,
            "project_latitude": project.project_latitude,
            "project_longitude": project.project_longitude,
            "location_tolerance_km": project.location_tolerance_km,
            "gov_wallet": project.gov_wallet,
            "on_chain_id": project.on_chain_id,
            "created_at": project.created_at
        }
        projects_with_currency.append(project_dict)
    
    return {
        "projects": projects_with_currency,
        "exchange_rate": get_eth_ngn_rate()
    }

@app.get("/projects/{project_id}")
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Add currency conversion for frontend display
    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "total_budget_eth": project.total_budget,
        "total_budget_ngn": convert_eth_to_ngn(project.total_budget),
        "contractor_id": project.contractor_id,
        "ai_generated": project.ai_generated,
        "project_latitude": project.project_latitude,
        "project_longitude": project.project_longitude,
        "location_tolerance_km": project.location_tolerance_km,
        "gov_wallet": project.gov_wallet,
        "on_chain_id": project.on_chain_id,
        "created_at": project.created_at,
        "exchange_rate": get_eth_ngn_rate()
    }
    return project_dict

@app.put("/projects/{project_id}")
async def update_project(project_id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update only provided fields
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated milestones first
    db.query(Milestone).filter(Milestone.project_id == project_id).delete()
    # Delete project
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

def extract_video_location(video_path: str):
    """Extract GPS coordinates from video metadata using ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        metadata = json_lib.loads(result.stdout)
        
        tags = metadata.get('format', {}).get('tags', {})
        
        # Look for GPS coordinates in various tag formats
        lat_keys = ['location-lat', 'GPS_LATITUDE', 'com.apple.quicktime.location.ISO6709']
        lon_keys = ['location-lon', 'GPS_LONGITUDE', 'com.apple.quicktime.location.ISO6709']
        
        lat, lon = None, None
        
        for key in lat_keys:
            if key in tags:
                lat = float(tags[key])
                break
                
        for key in lon_keys:
            if key in tags:
                lon = float(tags[key])
                break
        
        return lat, lon
    except Exception:
        return None, None

@app.post("/verify-milestone", response_model=VerificationResponse)
async def verify_milestone(request: VerificationRequest, wallet_address: str = Depends(verify_token), db: Session = Depends(get_db)):
    temp_file_path = None
    try:
        # Get project location data
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Download video from IPFS URL to temporary file
        response_video = requests.get(request.video_url, stream=True)
        response_video.raise_for_status()
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_file_path = temp_file.name
        
        # Save video to temp file
        with open(temp_file_path, 'wb') as f:
            shutil.copyfileobj(response_video.raw, f)
        
        # Extract GPS coordinates from video metadata using ffprobe
        video_lat, video_lon = extract_video_location(temp_file_path)
        
        # Verify location if GPS data exists
        if video_lat and video_lon:
            project_coords = (project.project_latitude, project.project_longitude)
            video_coords = (video_lat, video_lon)
            distance_km = geodesic(project_coords, video_coords).kilometers
            
            if distance_km > project.location_tolerance_km:
                return VerificationResponse(
                    verified=False,
                    confidence_score=0,
                    reasoning=f"Location fraud detected: Video taken {distance_km:.2f}km from project site"
                )
        
        # Gemini prompt for construction verification
        prompt = f"""You are an expert civil engineer and strict auditor. Your job is to verify construction milestones from video footage. You must be skeptical.

Milestone Description: {request.milestone_criteria}

Task: Analyze the video frames. Does the visual evidence CONCLUSIVELY prove this milestone is complete?

Return ONLY a JSON object:
{{
"verified": boolean,
"confidence_score": integer (0-100),
"reasoning": "string (max 1 sentence explaining why)"
}}"""

        # Upload local video file and analyze
        video_file = genai.upload_file(temp_file_path)
        response = model.generate_content([prompt, video_file])
        
        # Parse Gemini response
        result = json.loads(response.text)
        
        if result["verified"] and result["confidence_score"] >= 95:
            # Priority: Sui first, then Ethereum
            
            # 1. Release Sui Funds (if configured) - PRIORITY
            if hasattr(project, 'sui_project_id') and project.sui_project_id:
                milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
                milestone_count = len(milestones) if milestones else 1
                
                # Divide project budget by number of milestones
                amount_sui = project.total_budget / milestone_count
                payout_mist = int(amount_sui * 1_000_000_000)
                
                sui_tx = await release_funds_sui(project.sui_project_id, payout_mist)
                if sui_tx:
                    result["sui_transaction"] = sui_tx
                    result["primary_chain"] = "sui"
            
            # 2. Release Ethereum Funds (if no Sui or as secondary)
            if hasattr(project, 'on_chain_id') and project.on_chain_id:
                eth_tx = await release_funds(project.on_chain_id, request.milestone_index)
                if eth_tx:
                    result["ethereum_transaction"] = eth_tx
                    # Only mark as primary if Sui wasn't used
                    if "primary_chain" not in result:
                        result["primary_chain"] = "ethereum"
        
        return VerificationResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

async def release_funds(project_id: int, milestone_index: int):
    """Trigger smart contract to release milestone funds"""
    try:
        # Contract ABI (updated for releaseMilestone function)
        contract_abi = [
            {
                "inputs": [
                    {"name": "_projectId", "type": "uint256"},
                    {"name": "_milestoneIndex", "type": "uint256"},
                    {"name": "_verdict", "type": "bool"}
                ],
                "name": "releaseMilestone",
                "outputs": [],
                "type": "function"
            }
        ]
        
        contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        account = w3.eth.account.from_key(private_key)
        
        # Build transaction
        transaction = contract.functions.releaseMilestone(project_id, milestone_index, True).build_transaction({
            'from': account.address,
            'gas': 100000,
            'gasPrice': w3.to_wei('20', 'gwei'),
            'nonce': w3.eth.get_transaction_count(account.address)
        })
        
        # Sign and send
        signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        return tx_hash.hex()
        
    except Exception as e:
        print(f"Blockchain transaction failed: {e}")
        return None

@app.get("/")
async def root():
    return {"message": "Optic-Gov AI Oracle API", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health_check():
    return {"status": "AI Oracle is watching"}

@app.get("/eth-rate")
async def get_current_eth_rate():
    """Get current ETH to NGN exchange rate"""
    rate = get_eth_ngn_rate()
    return {
        "eth_to_ngn_rate": rate,
        "timestamp": datetime.now().isoformat(),
        "cache_age_seconds": time.time() - (eth_ngn_cache["timestamp"] or 0)
    }

@app.get("/exchange-rate")
async def get_exchange_rate_frontend():
    """Get current ETH to NGN exchange rate (frontend compatibility)"""
    try:
        rate = get_eth_ngn_rate()
        return {
            "eth_to_ngn": rate,
            "ngn_to_eth": 1 / rate,
            "timestamp": datetime.now().isoformat(),
            "cached": time.time() - (eth_ngn_cache["timestamp"] or 0) < CACHE_DURATION
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get exchange rate: {str(e)}")

@app.get("/convert/ngn-to-eth/{naira_amount}")
async def convert_ngn_to_eth_endpoint(naira_amount: float):
    """Quick convert NGN to ETH"""
    rate = get_eth_ngn_rate()
    eth_amount = naira_amount / rate
    return {
        "naira_amount": naira_amount,
        "eth_amount": eth_amount,
        "exchange_rate": rate,
        "formatted_eth": f"{eth_amount:.6f} ETH",
        "formatted_naira": f"₦{naira_amount:,.2f}"
    }

@app.get("/convert/eth-to-ngn/{eth_amount}")
async def convert_eth_to_ngn_endpoint(eth_amount: float):
    """Quick convert ETH to NGN"""
    rate = get_eth_ngn_rate()
    naira_amount = eth_amount * rate
    return {
        "eth_amount": eth_amount,
        "naira_amount": naira_amount,
        "exchange_rate": rate,
        "formatted_eth": f"{eth_amount:.6f} ETH",
        "formatted_naira": f"₦{naira_amount:,.2f}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)