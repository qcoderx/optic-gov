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

# CORRECTED SUI IMPORTS for pysui 0.65.0d
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
model = genai.GenerativeModel('gemini-3-flash-preview')

# Configure Web3 (Keep for legacy/fallback, but SUI is now primary)
w3 = Web3(Web3.HTTPProvider(os.getenv("SEPOLIA_RPC_URL")))
private_key = os.getenv("ETHEREUM_PRIVATE_KEY")
contract_address = os.getenv("CONTRACT_ADDRESS")

# Currency conversion cache (Switched to SUI)
sui_ngn_cache = {"rate": None, "timestamp": None}
CACHE_DURATION = 300  # 5 minutes

def get_sui_client():
    """Initialize SUI client with oracle keypair"""
    rpc_url = os.getenv("SUI_RPC_URL")
    mnemonic = os.getenv("SUI_ORACLE_MNEMONIC")
    
    if not mnemonic:
        print("❌ SUI_ORACLE_MNEMONIC not found in .env")
        return None
    
    try:
        _, kp, addr_obj = recover_key_and_address(
            keytype=0,  # ED25519
            mnemonics=mnemonic,
            derv_path="m/44'/784'/0'/0'/0'"
        )
        
        print(f"✅ SUI Oracle Address: {addr_obj.address}")
        
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

def get_sui_ngn_rate():
    """Get SUI to NGN exchange rate with caching and error handling"""
    current_time = time.time()
    
    # Check if cache is valid
    if (sui_ngn_cache["rate"] is not None and 
        sui_ngn_cache["timestamp"] is not None and 
        current_time - sui_ngn_cache["timestamp"] < CACHE_DURATION):
        return sui_ngn_cache["rate"]
    
    try:
        # Get SUI price in USD from CoinGecko
        sui_response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd",
            timeout=5
        )
        
        # Handle API errors gracefully
        if sui_response.status_code != 200:
            print(f"⚠️ CoinGecko Error: {sui_response.status_code}")
            return sui_ngn_cache["rate"] if sui_ngn_cache["rate"] else 2500 # Default fallback
            
        data = sui_response.json()
        if "sui" not in data or "usd" not in data["sui"]:
            print("⚠️ CoinGecko malformed response")
            return sui_ngn_cache["rate"] if sui_ngn_cache["rate"] else 2500

        sui_usd = data["sui"]["usd"]
        
        # Get USD to NGN rate
        usd_ngn_response = requests.get(
            "https://api.exchangerate-api.com/v4/latest/USD",
            timeout=5
        )
        
        if usd_ngn_response.status_code != 200:
             return sui_ngn_cache["rate"] if sui_ngn_cache["rate"] else 2500
             
        usd_ngn = usd_ngn_response.json().get("rates", {}).get("NGN", 1500)
        
        # Calculate SUI to NGN rate
        sui_ngn_rate = sui_usd * usd_ngn
        
        # Update cache
        sui_ngn_cache["rate"] = sui_ngn_rate
        sui_ngn_cache["timestamp"] = current_time
        
        return sui_ngn_rate
        
    except Exception as e:
        print(f"⚠️ Exchange rate fetch failed (using cache/fallback): {str(e)[:50]}")
        # Return cached rate if available, otherwise default
        return sui_ngn_cache["rate"] if sui_ngn_cache["rate"] else 2500  # Fallback: ~1.6 USD * 1500 NGN

async def release_funds_sui(project_object_id: str, amount_mist: int):
    """Trigger Sui contract to release funds"""
    if not sui_client:
        print("❌ SUI client not initialized")
        return None
    
    try:
        txn = SyncTransaction(client=sui_client)
        package_id = os.getenv("SUI_PACKAGE_ID")
        oracle_cap_id = os.getenv("SUI_ORACLE_CAP_ID")
        
        if not package_id or not oracle_cap_id:
            print("❌ Missing SUI_PACKAGE_ID or SUI_ORACLE_CAP_ID")
            return None
        
        txn.move_call(
            target=f"{package_id}::optic_gov::release_payment",
            arguments=[
                oracle_cap_id,
                project_object_id,
                str(amount_mist)
            ],
            type_arguments=[]
        )
        
        result = txn.execute(gas_budget="10000000")
        
        if result.is_ok():
            digest = result.result_data.digest
            print(f"✅ SUI Payout Successful: {digest}")
            return digest
        else:
            print(f"❌ SUI Payout Failed: {result.result_string}")
            return None
            
    except Exception as e:
        print(f"❌ SUI transaction failed: {e}")
        return None

def convert_ngn_to_sui(ngn_amount: float) -> float:
    """Convert NGN amount to SUI"""
    rate = get_sui_ngn_rate()
    if rate == 0: return 0
    return ngn_amount / rate

def convert_sui_to_ngn(sui_amount: float) -> float:
    """Convert SUI amount to NGN"""
    rate = get_sui_ngn_rate()
    return sui_amount * rate

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
    budget_currency: str = "NGN"  # "NGN" or "SUI"
    contractor_wallet: str
    use_ai_milestones: bool
    manual_milestones: Optional[List[str]] = None
    project_latitude: float
    project_longitude: float
    location_tolerance_km: float = 1.0
    gov_wallet: str
    on_chain_id: str

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
    sui_amount: float
    exchange_rate: float
    timestamp: str

class ConvertRequest(BaseModel):
    amount: float
    from_currency: str  # "NGN" or "SUI"
    to_currency: str    # "NGN" or "SUI"

class ManualMilestoneCreate(BaseModel):
    project_id: int
    description: str
    amount: float
    order_index: int

class DemoApprovalRequest(BaseModel):
    project_id: int
    milestone_id: int
    bypass: bool = True

@app.post("/demo-approve-milestone")
async def demo_approve_milestone(request: DemoApprovalRequest, db: Session = Depends(get_db)):
    """
    MODIFIED: Now raises strict errors if blockchain payment fails.
    """
    try:
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        milestone = db.query(Milestone).filter(Milestone.id == request.milestone_id).first()
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
            
        # 1. CRITICAL CHECK: Fail immediately if no blockchain ID
        if not project.on_chain_id:
            raise HTTPException(status_code=400, detail="❌ FATAL: This project is NOT on the blockchain. No 'on_chain_id' found in database.")

        # Calculate amount
        milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
        milestone_count = len(milestones) if milestones else 1
        amount_sui = project.total_budget / milestone_count
        payout_mist = int(amount_sui * 1_000_000_000)
        
        print(f"💰 ATTEMPTING PAYOUT: {amount_sui} SUI to project {project.on_chain_id}")

        # 2. EXECUTE TRANSACTION
        sui_tx = await release_funds_sui(str(project.on_chain_id), payout_mist)
        
        # 3. VERIFY TRANSACTION: Fail if no digest returned
        if not sui_tx:
            raise HTTPException(status_code=500, detail="❌ BLOCKCHAIN ERROR: Transaction failed. Check backend terminal for 'SUI Payout Failed' logs.")

        # If we get here, it actually worked
        milestone.status = "verified"
        milestone.is_completed = True
        db.commit()
        
        return {
            "success": True,
            "message": "Funds released successfully",
            "sui_transaction": sui_tx,
            "demo_mode": True
        }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL PAYMENT ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Payment failed: {str(e)}")

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
    """Convert between NGN and SUI"""
    try:
        rate = get_sui_ngn_rate()
        
        if request.from_currency.upper() == "NGN" and request.to_currency.upper() == "SUI":
            converted_amount = convert_ngn_to_sui(request.amount)
            return CurrencyConversion(
                naira_amount=request.amount,
                sui_amount=converted_amount,
                exchange_rate=rate,
                timestamp=datetime.now().isoformat()
            )
        elif request.from_currency.upper() == "SUI" and request.to_currency.upper() == "NGN":
            converted_amount = convert_sui_to_ngn(request.amount)
            return CurrencyConversion(
                naira_amount=converted_amount,
                sui_amount=request.amount,
                exchange_rate=rate,
                timestamp=datetime.now().isoformat()
            )
        else:
            raise HTTPException(status_code=400, detail="Only NGN<->SUI conversion supported")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.post("/generate-milestones")
async def generate_milestones(request: MilestoneGenerate):
    try:
        # Prompt explicitly mentions budget context
        prompt = f"""Generate 4-6 construction milestones for: {request.project_description}
Budget: ${request.total_budget:,.2f}

Return ONLY a JSON array like: ["Foundation excavation", "Concrete pouring", "Steel reinforcement"]"""
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if '[' in response_text and ']' in response_text:
            start = response_text.find('[')
            end = response_text.rfind(']') + 1
            json_text = response_text[start:end]
            milestones = json.loads(json_text)
        else:
            raise ValueError('AI did not return valid JSON')
        
        return {"milestones": milestones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI milestone generation failed: {str(e)}")

@app.post("/create-project")
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    contractor = db.query(Contractor).filter(Contractor.wallet_address == project.contractor_wallet).first()
    if not contractor:
        raise HTTPException(
            status_code=404, 
            detail="Contractor not found. Please register first at /register endpoint."
        )
    
    # Convert budget to SUI if provided in NGN
    budget_sui = project.total_budget
    budget_ngn = project.total_budget
    
    if project.budget_currency.upper() == "NGN":
        budget_sui = convert_ngn_to_sui(project.total_budget)
    else:
        budget_ngn = convert_sui_to_ngn(project.total_budget)
    
    # Create project (store SUI amount for blockchain consistency)
    db_project = Project(
        name=project.name,
        description=project.description,
        total_budget=budget_sui,  # Store SUI amount
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
        ai_response = await generate_milestones(MilestoneGenerate(
            project_description=project.description,
            total_budget=project.total_budget
        ))
        milestone_descriptions = ai_response["milestones"]
    else:
        milestone_descriptions = project.manual_milestones or []
    
    # Create milestone records (use SUI amount for milestones)
    if milestone_descriptions:
        milestone_amount = budget_sui / len(milestone_descriptions)
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
        "budget_sui": budget_sui,
        "budget_ngn": budget_ngn,
        "exchange_rate": get_sui_ngn_rate()
    }

@app.get("/projects")
async def get_all_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()

    projects_with_currency = []
    for project in projects:
        # SAFEGUARD: Handle None budget
        budget_sui = project.total_budget if project.total_budget is not None else 0.0

        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "total_budget_sui": budget_sui, # RETURN AS SUI
            "total_budget_ngn": convert_sui_to_ngn(budget_sui), # Now safe
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
        "exchange_rate": get_sui_ngn_rate()
    }

@app.get("/projects/{project_id}")
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).order_by(Milestone.order_index).all()
    milestone_list = []
    for m in milestones:
        milestone_list.append({
            "id": m.id,
            "description": m.description,
            "amount": m.amount,
            "status": m.status,
            "order_index": m.order_index,
            "criteria": f"Verify completion of: {m.description}"
        })

    # SAFEGUARD: Handle None budget
    budget_sui = project.total_budget if project.total_budget is not None else 0.0

    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "total_budget_sui": budget_sui,
        "total_budget_ngn": convert_sui_to_ngn(budget_sui), # Now safe
        "contractor_id": project.contractor_id,
        "ai_generated": project.ai_generated,
        "project_latitude": project.project_latitude,
        "project_longitude": project.project_longitude,
        "location_tolerance_km": project.location_tolerance_km,
        "gov_wallet": project.gov_wallet,
        "on_chain_id": project.on_chain_id,
        "created_at": project.created_at,
        "exchange_rate": get_sui_ngn_rate(),
        "milestones": milestone_list
    }
    return project_dict

@app.get("/milestones/{milestone_id}/project")
async def get_project_by_milestone(milestone_id: int, db: Session = Depends(get_db)):
    """Get project data by milestone ID"""
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # Return the project data for this milestone
    return await get_project(milestone.project_id, db)

@app.put("/projects/{project_id}")
async def update_project(project_id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project

@app.put("/projects/{project_id}/on-chain-id")
async def update_project_on_chain_id(project_id: int, on_chain_id: str, db: Session = Depends(get_db)):
    """Update only the on_chain_id field"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.on_chain_id = on_chain_id
    db.commit()
    print(f"✅ Updated project {project_id} with on_chain_id: {on_chain_id}")
    return {"success": True, "on_chain_id": on_chain_id}

@app.delete("/projects/{project_id}")
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.query(Milestone).filter(Milestone.project_id == project_id).delete()
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
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Download video
        response_video = requests.get(request.video_url, stream=True)
        response_video.raise_for_status()
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_file_path = temp_file.name
        
        with open(temp_file_path, 'wb') as f:
            shutil.copyfileobj(response_video.raw, f)
        
        # Location check
        video_lat, video_lon = extract_video_location(temp_file_path)
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
        
        # AI Verification
        prompt = f"""You are an expert civil engineer and strict auditor.
Milestone Description: {request.milestone_criteria}
Task: Analyze the video frames. Does the visual evidence CONCLUSIVELY prove this milestone is complete? Analyze quality, not just whether it's complete, make sure the materials used are state of the art!, and the execution is perfect
Return ONLY a JSON object: {{"verified": boolean, "confidence_score": integer (0-100), "reasoning": "string"}}"""

        video_file = genai.upload_file(temp_file_path)
        response = model.generate_content([prompt, video_file])
        result = json.loads(response.text)
        
        if result["verified"] and result["confidence_score"] >= 95:
            # Payout Logic - SUI PRIORITY
            if hasattr(project, 'on_chain_id') and project.on_chain_id:
                milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
                milestone_count = len(milestones) if milestones else 1
                
                # Calculate SUI amount (Project.total_budget is now SUI)
                amount_sui = project.total_budget / milestone_count
                payout_mist = int(amount_sui * 1_000_000_000) # 1 SUI = 10^9 MIST
                
                print(f"💰 Releasing {amount_sui} SUI ({payout_mist} MIST) to contractor")
                sui_tx = await release_funds_sui(str(project.on_chain_id), payout_mist)
                
                if sui_tx:
                    result["sui_transaction"] = sui_tx
                    result["primary_chain"] = "sui"
                    
                    # Update milestone status
                    ms = db.query(Milestone).filter(
                        Milestone.project_id == project.id, 
                        Milestone.order_index == request.milestone_index
                    ).first()
                    if ms:
                        ms.status = "verified"
                        ms.is_completed = True
                        db.commit()
                else:
                    result["error"] = "Sui transaction failed"
            else:
                result["error"] = "No on-chain ID found for SUI"
        
        return VerificationResponse(**result)
        
    except Exception as e:
        print(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@app.get("/")
async def root():
    return {"message": "Optic-Gov AI Oracle API (SUI Network)", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health_check():
    return {"status": "AI Oracle is watching"}

@app.get("/sui-rate")
async def get_current_sui_rate():
    """Get current SUI to NGN exchange rate"""
    rate = get_sui_ngn_rate()
    return {
        "sui_to_ngn_rate": rate,
        "timestamp": datetime.now().isoformat(),
        "cache_age_seconds": time.time() - (sui_ngn_cache["timestamp"] or 0)
    }

# Kept for backward compatibility if needed, but returns SUI rate now or could calculate ETH
@app.get("/eth-rate")
async def get_current_eth_rate():
    return await get_current_sui_rate()

@app.get("/exchange-rate")
async def get_exchange_rate_frontend():
    """Get current SUI to NGN exchange rate (frontend compatibility)"""
    try:
        rate = get_sui_ngn_rate()
        return {
            "sui_to_ngn": rate,
            "ngn_to_sui": 1 / rate if rate > 0 else 0,
            "timestamp": datetime.now().isoformat(),
            "cached": time.time() - (sui_ngn_cache["timestamp"] or 0) < CACHE_DURATION
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get exchange rate: {str(e)}")

@app.get("/convert/ngn-to-sui/{naira_amount}")
async def convert_ngn_to_sui_endpoint(naira_amount: float):
    """Quick convert NGN to SUI"""
    rate = get_sui_ngn_rate()
    if rate == 0: return {"error": "Rate unavailable"}
    sui_amount = naira_amount / rate
    return {
        "naira_amount": naira_amount,
        "sui_amount": sui_amount,
        "exchange_rate": rate,
        "formatted_sui": f"{sui_amount:.4f} SUI",
        "formatted_naira": f"₦{naira_amount:,.2f}"
    }

@app.get("/milestones/{milestone_id}")
async def get_milestone(milestone_id: int, db: Session = Depends(get_db)):
    """Get milestone details"""
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    return {
        "id": milestone.id,
        "project_id": milestone.project_id,
        "description": milestone.description,
        "amount": milestone.amount,
        "status": milestone.status,
        "order_index": milestone.order_index,
        "criteria": f"Verify completion of: {milestone.description}",
        "created_at": milestone.created_at
    }

@app.post("/milestones")
async def create_manual_milestone(milestone: ManualMilestoneCreate, db: Session = Depends(get_db)):
    """Create a manual milestone for a project"""
    # Verify project exists
    project = db.query(Project).filter(Project.id == milestone.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Convert amount to SUI if needed (assuming amount is in NGN for now)
    amount_sui = convert_ngn_to_sui(milestone.amount) if milestone.amount > 0 else milestone.amount

    # Create milestone
    db_milestone = Milestone(
        project_id=milestone.project_id,
        description=milestone.description,
        amount=amount_sui,
        order_index=milestone.order_index,
        status="pending"
    )
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)

    return {
        "id": db_milestone.id,
        "project_id": db_milestone.project_id,
        "description": db_milestone.description,
        "amount": db_milestone.amount,
        "amount_ngn": convert_sui_to_ngn(db_milestone.amount),
        "status": db_milestone.status,
        "order_index": db_milestone.order_index,
        "created_at": db_milestone.created_at
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)