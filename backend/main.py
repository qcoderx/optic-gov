import os
import json
import time
import requests
import tempfile
import shutil
import subprocess
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from geopy.distance import geodesic
import google.generativeai as genai
from dotenv import load_dotenv

# Local imports (ensure these files exist in your directory)
from database import get_db, Contractor, Project, Milestone
from auth import hash_password, verify_password, create_access_token, verify_token

load_dotenv()

app = FastAPI(title="Optic-Gov Mantle AI Oracle")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- CONFIGURATION ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-3-flash-preview')

# Mantle Setup
MANTLE_RPC_URL = os.getenv("MANTLE_RPC_URL", "https://rpc.sepolia.mantle.xyz")
w3 = Web3(Web3.HTTPProvider(MANTLE_RPC_URL))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)  # Required for L2s

ORACLE_PRIVATE_KEY = os.getenv("ETHEREUM_PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
ORACLE_ADDRESS = w3.eth.account.from_key(ORACLE_PRIVATE_KEY).address

# Load ABI (Ensure the path is correct relative to main.py)
ABI_FILE_PATH = os.path.join(BASE_DIR, "OpticGov.json")
with open(ABI_FILE_PATH, "r") as f:
    contract_json = json.load(f)
    contract_abi = contract_json["abi"]

optic_gov_contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)

# --- HELPERS ---
mnt_ngn_cache = {"rate": None, "timestamp": None}
CACHE_DURATION = 300  # 5 minutes

def get_mnt_ngn_rate():
    """Fetch MNT to NGN exchange rate with caching"""
    current_time = time.time()
    
    # Check if cache is valid
    if (mnt_ngn_cache["rate"] is not None and 
        mnt_ngn_cache["timestamp"] is not None and 
        current_time - mnt_ngn_cache["timestamp"] < CACHE_DURATION):
        return mnt_ngn_cache["rate"]
    
    try:
        # Get MNT price in USD from CoinGecko
        mnt_response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd",
            timeout=5
        )
        
        # Handle API errors gracefully
        if mnt_response.status_code != 200:
            print(f"⚠️ CoinGecko Error: {mnt_response.status_code}")
            return mnt_ngn_cache["rate"] if mnt_ngn_cache["rate"] else 1200  # Default fallback
            
        data = mnt_response.json()
        if "mantle" not in data or "usd" not in data["mantle"]:
            print("⚠️ CoinGecko malformed response")
            return mnt_ngn_cache["rate"] if mnt_ngn_cache["rate"] else 1200

        mnt_usd = data["mantle"]["usd"]
        
        # Get USD to NGN rate
        usd_ngn_response = requests.get(
            "https://api.exchangerate-api.com/v4/latest/USD",
            timeout=5
        )
        
        if usd_ngn_response.status_code != 200:
            return mnt_ngn_cache["rate"] if mnt_ngn_cache["rate"] else 1200
             
        usd_ngn = usd_ngn_response.json().get("rates", {}).get("NGN", 1500)
        
        # Calculate MNT to NGN rate
        mnt_ngn_rate = mnt_usd * usd_ngn
        
        # Update cache
        mnt_ngn_cache["rate"] = mnt_ngn_rate
        mnt_ngn_cache["timestamp"] = current_time
        
        return mnt_ngn_rate
        
    except Exception as e:
        print(f"⚠️ Exchange rate fetch failed (using cache/fallback): {str(e)[:50]}")
        return mnt_ngn_cache["rate"] if mnt_ngn_cache["rate"] else 1200

def convert_ngn_to_mnt(ngn_amount: float) -> float:
    """Convert NGN amount to MNT"""
    rate = get_mnt_ngn_rate()
    if rate == 0: return 0
    return ngn_amount / rate

def convert_mnt_to_ngn(mnt_amount: float) -> float:
    """Convert MNT amount to NGN"""
    rate = get_mnt_ngn_rate()
    return mnt_amount * rate

async def release_funds_mantle(project_on_chain_id: int, milestone_index: int):
    """Trigger Mantle contract to release funds"""
    try:
        nonce = w3.eth.get_transaction_count(ORACLE_ADDRESS)
        
        # Build transaction
        tx = optic_gov_contract.functions.releaseMilestone(
            project_on_chain_id, 
            milestone_index, 
            True
        ).build_transaction({
            'chainId': 5003,  # Mantle Sepolia testnet chain ID
            'gas': 300000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # 1. Sign the transaction
        # Ensure you use 'raw_transaction' (snake_case) for Web3.py v7
        signed = w3.eth.account.sign_transaction(tx, ORACLE_PRIVATE_KEY)
        
        # 2. Send the transaction
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        
        # 3. Convert bytes to a readable hex string (e.g., "0x...")
        readable_hash = tx_hash.hex()
        
        print(f"✅ Mantle Payout Successful: {readable_hash}")
        return readable_hash
        
    except Exception as e:
        print(f"❌ Mantle transaction failed: {e}")
        return None

def extract_video_location(video_path: str):
    try:
        cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', video_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        metadata = json.loads(result.stdout)
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

# --- MODELS ---
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
    budget_currency: str = "NGN"  # "NGN" or "MNT"
    contractor_wallet: str
    use_ai_milestones: bool
    manual_milestones: Optional[List[str]] = None
    project_latitude: float
    project_longitude: float
    location_tolerance_km: float = 1.0
    gov_wallet: str
    on_chain_id: Optional[int] = None  # Changed to int for Mantle

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
    mnt_amount: float
    exchange_rate: float
    timestamp: str

class ConvertRequest(BaseModel):
    amount: float
    from_currency: str  # "NGN" or "MNT"
    to_currency: str    # "NGN" or "MNT"

class ManualMilestoneCreate(BaseModel):
    project_id: int
    description: str
    amount: float
    order_index: int

class DemoApprovalRequest(BaseModel):
    project_id: int
    milestone_id: int
    bypass: bool = True

# --- ENDPOINTS ---

@app.post("/demo-approve-milestone")
async def demo_approve_milestone(request: DemoApprovalRequest, db: Session = Depends(get_db)):
    """MODIFIED: Now raises strict errors if blockchain payment fails."""
    try:
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        milestone = db.query(Milestone).filter(Milestone.id == request.milestone_id).first()
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
            
        # 1. CRITICAL CHECK: Fail immediately if no blockchain ID
        if not project.on_chain_id:
            raise HTTPException(
                status_code=400, 
                detail=f"❌ FATAL: Project {project.id} is NOT on the blockchain. Missing 'on_chain_id'. Please create the project on Mantle blockchain first using the Mantle service."
            )

        # 2. EXECUTE TRANSACTION
        mantle_tx = await release_funds_mantle(int(project.on_chain_id), milestone.order_index)
        
        # 3. VERIFY TRANSACTION: Fail if no tx_hash returned
        if not mantle_tx:
            raise HTTPException(status_code=500, detail="❌ BLOCKCHAIN ERROR: Transaction failed. Check backend terminal for 'Mantle Payout Failed' logs.")

        # If we get here, it actually worked
        milestone.status = "verified"
        milestone.is_completed = True
        db.commit()
        
        return {
            "success": True,
            "message": "Funds released successfully",
            "mantle_transaction": mantle_tx,
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

@app.post("/create-test-data")
async def create_test_data(db: Session = Depends(get_db)):
    """Create test data for development"""
    try:
        # Create test contractor
        test_contractor = Contractor(
            wallet_address="0x1234567890abcdef",
            company_name="Nigerian Infrastructure Ltd",
            email="test@example.com",
            password_hash=hash_password("password123")
        )
        db.add(test_contractor)
        db.commit()
        db.refresh(test_contractor)
        
        # Create test project
        test_project = Project(
            name="Lagos-Ibadan Highway Expansion",
            description="Major highway infrastructure project connecting Lagos and Ibadan",
            total_budget=1000.0,  # 1000 MNT
            contractor_id=test_contractor.id,
            ai_generated=True,
            project_latitude=6.5244,
            project_longitude=3.3792,
            location_tolerance_km=1.0,
            gov_wallet="0xgov123",
            on_chain_id=1  # Demo on-chain ID as integer
        )
        db.add(test_project)
        db.commit()
        db.refresh(test_project)
        
        # Create test milestones
        milestones = [
            {"description": "Site Survey and Planning", "status": "completed"},
            {"description": "Foundation and Infrastructure", "status": "completed"},
            {"description": "Main Construction Phase", "status": "pending"},
            {"description": "Final Inspection and Handover", "status": "pending"}
        ]
        
        milestone_amount = test_project.total_budget / len(milestones)
        for i, milestone_data in enumerate(milestones):
            milestone = Milestone(
                project_id=test_project.id,
                description=milestone_data["description"],
                amount=milestone_amount,
                order_index=i + 1,
                status=milestone_data["status"]
            )
            db.add(milestone)
        
        db.commit()
        return {"message": "Test data created", "project_id": test_project.id, "contractor_id": test_contractor.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create test data: {str(e)}")

@app.post("/convert-currency")
async def convert_currency(request: ConvertRequest):
    """Convert between NGN and MNT"""
    try:
        rate = get_mnt_ngn_rate()
        
        if request.from_currency.upper() == "NGN" and request.to_currency.upper() == "MNT":
            converted_amount = convert_ngn_to_mnt(request.amount)
            return CurrencyConversion(
                naira_amount=request.amount,
                mnt_amount=converted_amount,
                exchange_rate=rate,
                timestamp=datetime.now().isoformat()
            )
        elif request.from_currency.upper() == "MNT" and request.to_currency.upper() == "NGN":
            converted_amount = convert_mnt_to_ngn(request.amount)
            return CurrencyConversion(
                naira_amount=converted_amount,
                mnt_amount=request.amount,
                exchange_rate=rate,
                timestamp=datetime.now().isoformat()
            )
        else:
            raise HTTPException(status_code=400, detail="Only NGN<->MNT conversion supported")
            
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
    
    # Convert budget to MNT if provided in NGN
    budget_mnt = project.total_budget
    budget_ngn = project.total_budget
    
    if project.budget_currency.upper() == "NGN":
        budget_mnt = convert_ngn_to_mnt(project.total_budget)
    else:
        budget_ngn = convert_mnt_to_ngn(project.total_budget)
    
    # CRITICAL FIX: Ensure on_chain_id is provided and not empty
    if not project.on_chain_id:
        # For demo purposes, generate a placeholder on_chain_id
        import random
        project.on_chain_id = random.randint(1000, 9999)
        print(f"⚠️ WARNING: No on_chain_id provided. Using demo ID: {project.on_chain_id}")
    
    # Create project (store MNT amount for blockchain consistency)
    db_project = Project(
        name=project.name,
        description=project.description,
        total_budget=budget_mnt,  # Store MNT amount
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
    
    # Create milestone records (use MNT amount for milestones)
    if milestone_descriptions:
        milestone_amount = budget_mnt / len(milestone_descriptions)
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
        "budget_mnt": budget_mnt,
        "budget_ngn": budget_ngn,
        "exchange_rate": get_mnt_ngn_rate()
    }

@app.get("/projects")
async def get_all_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()

    projects_with_currency = []
    for project in projects:
        # SAFEGUARD: Handle None budget
        budget_mnt = project.total_budget if project.total_budget is not None else 0.0

        project_dict = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "total_budget_mnt": budget_mnt, # RETURN AS MNT
            "total_budget_ngn": convert_mnt_to_ngn(budget_mnt), # Now safe
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
        "exchange_rate": get_mnt_ngn_rate()
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
    budget_mnt = project.total_budget if project.total_budget is not None else 0.0

    project_dict = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "total_budget_mnt": budget_mnt,
        "total_budget_ngn": convert_mnt_to_ngn(budget_mnt),
        "contractor_id": project.contractor_id,
        "ai_generated": project.ai_generated,
        "project_latitude": project.project_latitude,
        "project_longitude": project.project_longitude,
        "location_tolerance_km": project.location_tolerance_km,
        "gov_wallet": project.gov_wallet,
        "on_chain_id": project.on_chain_id,
        "created_at": project.created_at,
        "exchange_rate": get_mnt_ngn_rate(),
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
async def update_project_on_chain_id(project_id: int, on_chain_id: int, db: Session = Depends(get_db)):
    """Update only the on_chain_id field (now as integer)"""
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
            # Payout Logic - Mantle blockchain
            if hasattr(project, 'on_chain_id') and project.on_chain_id:
                # Trigger Mantle contract
                mantle_tx = await release_funds_mantle(int(project.on_chain_id), request.milestone_index)
                
                if mantle_tx:
                    result["mantle_transaction"] = mantle_tx
                    result["primary_chain"] = "mantle"
                    
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
                    result["error"] = "Mantle transaction failed"
            else:
                result["error"] = "No on-chain ID found for Mantle"
        
        return VerificationResponse(**result)
        
    except Exception as e:
        print(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@app.get("/")
async def root():
    return {"message": "Optic-Gov Mantle AI Oracle API", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health_check():
    return {"status": "AI Oracle is watching"}

@app.get("/mnt-rate")
async def get_current_mnt_rate():
    """Get current MNT to NGN exchange rate"""
    rate = get_mnt_ngn_rate()
    return {
        "mnt_to_ngn_rate": rate,
        "timestamp": datetime.now().isoformat(),
        "cache_age_seconds": time.time() - (mnt_ngn_cache["timestamp"] or 0)
    }

@app.get("/exchange-rate")
async def get_exchange_rate_frontend():
    """Get current MNT to NGN exchange rate (frontend compatibility)"""
    try:
        rate = get_mnt_ngn_rate()
        return {
            "mnt_to_ngn": rate,
            "ngn_to_mnt": 1 / rate if rate > 0 else 0,
            "timestamp": datetime.now().isoformat(),
            "cached": time.time() - (mnt_ngn_cache["timestamp"] or 0) < CACHE_DURATION
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get exchange rate: {str(e)}")

@app.get("/convert/ngn-to-mnt/{naira_amount}")
async def convert_ngn_to_mnt_endpoint(naira_amount: float):
    """Quick convert NGN to MNT"""
    rate = get_mnt_ngn_rate()
    if rate == 0: return {"error": "Rate unavailable"}
    mnt_amount = naira_amount / rate
    return {
        "naira_amount": naira_amount,
        "mnt_amount": mnt_amount,
        "exchange_rate": rate,
        "formatted_mnt": f"{mnt_amount:.4f} MNT",
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
        "amount_ngn": convert_mnt_to_ngn(milestone.amount),
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

    # Convert amount to MNT
    amount_mnt = convert_ngn_to_mnt(milestone.amount) if milestone.amount > 0 else milestone.amount

    # Create milestone
    db_milestone = Milestone(
        project_id=milestone.project_id,
        description=milestone.description,
        amount=amount_mnt,
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
        "amount_ngn": convert_mnt_to_ngn(db_milestone.amount),
        "status": db_milestone.status,
        "order_index": db_milestone.order_index,
        "created_at": db_milestone.created_at
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)