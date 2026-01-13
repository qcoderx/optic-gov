# Imports 
import asyncio
import os
import json
import time
import requests
import tempfile
import shutil
import uuid
import subprocess
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File # <--- Ensure UploadFile and File are here
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

app = FastAPI(title="Optic-Gov Mantle AI Oracle", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

os.makedirs(os.path.join(BASE_DIR, "static", "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

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
    """
    Release milestone funds on Mantle blockchain
    
    Args:
        project_on_chain_id: The on-chain project ID (integer)
        milestone_index: The milestone index FROM YOUR DB (1-based)
    """
    try:
        # Convert to pure integers
        p_id = int(project_on_chain_id)
        m_idx = int(milestone_index) - 1  # DB uses 1-based, blockchain uses 0-based
        
        print(f"🔄 RELEASING: Project {p_id}, Milestone {m_idx} (DB index: {milestone_index})")

        # 1. CRITICAL: Check if milestone exists on-chain first
        try:
            milestone_info = optic_gov_contract.functions.getMilestone(p_id, m_idx).call()
            print(f"📋 Milestone Info: Amount={milestone_info[1]}, Completed={milestone_info[2]}, Released={milestone_info[3]}")
            
            if milestone_info[2]:  # isCompleted
                print(f"⚠️ WARNING: Milestone already marked as completed on-chain")
                if milestone_info[3]:  # isReleased
                    print(f"❌ ERROR: Funds already released for this milestone")
                    return None
        except Exception as e:
            print(f"❌ ERROR: Could not fetch milestone info: {e}")
            print(f"💡 TIP: Make sure project {p_id} exists on-chain with at least {m_idx + 1} milestones")
            return None

        # 2. Get the current nonce
        nonce = w3.eth.get_transaction_count(ORACLE_ADDRESS)

        # 3. FIXED: Let Web3 estimate the gas properly
        # First, try to estimate gas to see what's actually needed
        try:
            estimated_gas = optic_gov_contract.functions.releaseMilestone(
                p_id,
                m_idx,
                True
            ).estimate_gas({
                'from': ORACLE_ADDRESS,
                'nonce': nonce
            })
            print(f"⛽ Estimated Gas: {estimated_gas}")
            # Add 50% buffer to be safe
            gas_limit = int(estimated_gas * 1.5)
        except Exception as est_error:
            print(f"⚠️ Gas estimation failed: {est_error}")
            print(f"💡 Using fallback gas limit of 2,000,000")
            gas_limit = 2_000_000

        # 4. Get current gas price and add buffer for L2
        base_gas_price = w3.eth.gas_price
        gas_price = int(base_gas_price * 1.5)  # 50% buffer for L2 data fees
        
        print(f"⛽ Gas Limit: {gas_limit:,}")
        print(f"💰 Gas Price: {gas_price:,} wei ({w3.from_wei(gas_price, 'gwei'):.2f} gwei)")

        # 5. Build the transaction (Legacy style for Mantle compatibility)
        tx_data = optic_gov_contract.functions.releaseMilestone(
            p_id,
            m_idx,
            True
        ).build_transaction({
            'from': ORACLE_ADDRESS,
            'nonce': nonce,
            'gas': gas_limit,
            'gasPrice': gas_price,
            'chainId': 5003,  # Mantle Sepolia
        })

        # 6. Sign and Broadcast
        signed_tx = w3.eth.account.sign_transaction(tx_data, ORACLE_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        print(f"🚀 BROADCASTED: {tx_hash.hex()}")
        print(f"🔗 View on Explorer: https://sepolia.mantlescan.xyz/tx/{tx_hash.hex()}")
        
        # 7. Wait for receipt with longer timeout
        print(f"⏳ Waiting for confirmation...")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
        
        if receipt.status == 1:
            print(f"✅ BLOCKCHAIN CONFIRMED")
            print(f"   Gas Used: {receipt.gasUsed:,}")
            print(f"   Block: {receipt.blockNumber}")
            return tx_hash.hex()
        else:
            print(f"❌ TRANSACTION REVERTED ON-CHAIN")
            print(f"   Receipt: {receipt}")
            return None

    except ValueError as e:
        error_data = str(e)
        print(f"❌ TRANSACTION REJECTED: {error_data}")
        
        # Parse common errors
        if "insufficient funds" in error_data.lower():
            print(f"💡 FIX: Add more MNT to oracle wallet: {ORACLE_ADDRESS}")
        elif "nonce too low" in error_data.lower():
            print(f"💡 FIX: Another transaction is pending. Wait or increase nonce.")
        elif "already known" in error_data.lower():
            print(f"💡 FIX: Transaction already submitted. Check mempool.")
        
        return None
        
    except Exception as e:
        print(f"❌ MANTLE FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


# BONUS: Add this diagnostic function to check before attempting release
async def check_project_on_chain(project_on_chain_id: int, db: Session):
    """Verify project exists on-chain with proper setup"""
    try:
        p_id = int(project_on_chain_id)
        
        print(f"\n{'='*60}")
        print(f"🔍 CHECKING ON-CHAIN STATE: Project {p_id}")
        print(f"{'='*60}")
        
        # Get project from contract
        project_data = optic_gov_contract.functions.projects(p_id).call()
        
        print(f"📊 Project Data:")
        print(f"   Funder: {project_data[0]}")
        print(f"   Contractor: {project_data[1]}")
        print(f"   Total Budget: {w3.from_wei(project_data[2], 'ether')} MNT")
        print(f"   Funds Released: {w3.from_wei(project_data[3], 'ether')} MNT")
        print(f"   Milestone Count: {project_data[4]}")
        
        # Check each milestone
        milestone_count = project_data[4]
        print(f"\n📋 Milestones:")
        for i in range(milestone_count):
            m = optic_gov_contract.functions.getMilestone(p_id, i).call()
            print(f"   [{i}] {m[0][:50]}...")
            print(f"       Amount: {w3.from_wei(m[1], 'ether')} MNT")
            print(f"       Completed: {m[2]} | Released: {m[3]}")
        
        # Check oracle address
        contract_oracle = optic_gov_contract.functions.oracleAddress().call()
        oracle_match = contract_oracle.lower() == ORACLE_ADDRESS.lower()
        
        print(f"\n🔑 Oracle Check:")
        print(f"   Contract Oracle: {contract_oracle}")
        print(f"   Backend Oracle: {ORACLE_ADDRESS}")
        print(f"   Match: {'✅' if oracle_match else '❌'}")
        
        if not oracle_match:
            print(f"\n❌ CRITICAL: Oracle address mismatch!")
            print(f"   Your backend cannot release funds.")
            print(f"   Update contract or use correct private key.")
        
        print(f"{'='*60}\n")
        
        return {
            "exists": True,
            "milestone_count": milestone_count,
            "oracle_match": oracle_match
        }
        
    except Exception as e:
        print(f"❌ Project {p_id} does NOT exist on-chain: {e}")
        return {"exists": False, "error": str(e)}

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
        mantle_tx = asyncio.run(release_funds_mantle(int(project.on_chain_id), milestone.order_index))
        
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

@app.get("/test-gemini")
async def test_gemini_connection():
    """Test if Gemini API is working"""
    try:
        # Test basic text generation
        test_response = model.generate_content("Say 'Hello, Gemini is working!' in JSON format: {\"status\": \"working\", \"message\": \"...\"}")
        
        return {
            "gemini_available": True,
            "api_key_configured": bool(os.getenv("GEMINI_API_KEY")),
            "model": "gemini-2.5-flash-preview",
            "test_response": test_response.text,
            "message": "Gemini API is functioning correctly"
        }
    except Exception as e:
        return {
            "gemini_available": False,
            "api_key_configured": bool(os.getenv("GEMINI_API_KEY")),
            "error": str(e),
            "message": "Gemini API test failed"
        }

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
    contractor = db.query(Contractor).filter(
        Contractor.wallet_address.ilike(project.contractor_wallet) 
    ).first()
    
    if not contractor:
        # If ilike isn't working for some reason, try this fallback:
        contractor = db.query(Contractor).filter(
            Contractor.wallet_address == project.contractor_wallet.lower()
        ).first()

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
    
    # FIXED: Use the milestone descriptions that were already sent from frontend
    # The frontend already generated them (with AI or manually) and deployed to blockchain
    # We should use the EXACT same milestones that are on the blockchain
    milestone_descriptions = project.manual_milestones or []
    
    # If no milestones were sent, fall back to generating them (backward compatibility)
    if not milestone_descriptions and project.use_ai_milestones:
        try:
            print(f"⚠️ WARNING: No milestones provided by frontend, generating new ones...")
            ai_response = await generate_milestones(MilestoneGenerate(
                project_description=project.description,
                total_budget=project.total_budget
            ))
            milestone_descriptions = ai_response["milestones"]
            print(f"✨ AI Generated {len(milestone_descriptions)} milestones")
        except Exception as e:
            print(f"❌ AI Generation failed: {e}")
            milestone_descriptions = ["Project Initial Phase", "Main Construction", "Final Inspection"]
    
    print(f"📋 Creating {len(milestone_descriptions)} milestones in database")
    
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
    
    print(f"✅ Project {db_project.id} created with {len(milestone_descriptions)} milestones")
    
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

# main.py

@app.get("/projects/{project_id}")
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch milestones
    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).all()
    
    # 1. Calculate NGN equivalent using your existing conversion logic
    # (Assuming you have a function called convert_mnt_to_ngn)
    total_ngn = convert_mnt_to_ngn(project.total_budget)
    
    project_dict = {c.name: getattr(project, c.name) for c in project.__table__.columns}
    
    # 2. Inject the calculated fields into the response
    project_dict["total_budget_mnt"] = project.total_budget
    project_dict["total_budget_ngn"] = total_ngn
    
    project_dict["milestones"] = [
        {
            "id": m.id,
            "description": m.description,
            "amount": m.amount,
            "amount_ngn": convert_mnt_to_ngn(m.amount), # Convert per milestone too
            "status": m.status,
            "order_index": m.order_index
        } for m in milestones
    ]
    
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

class VerificationRequest(BaseModel):
    video_url: str
    milestone_criteria: str
    project_id: int
    milestone_index: int

class VerificationResponse(BaseModel):
    verified: bool
    confidence_score: int
    reasoning: str
    mantle_transaction: Optional[str] = None
    primary_chain: Optional[str] = None
    error: Optional[str] = None

# 2. Upload Endpoint
@app.post("/upload-video")
async def upload_video(video: UploadFile = File(...)):
    try:
        file_extension = video.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(BASE_DIR, "static", "uploads", file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
            
        video_url = f"http://localhost:8000/static/uploads/{file_name}"
        return {"video_url": video_url}
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# Replace your verify_milestone endpoint with this version
@app.post("/verify-milestone", response_model=VerificationResponse)
async def verify_milestone(request: VerificationRequest, db: Session = Depends(get_db)):
    print(f"\n{'='*60}\n🔍 STARTING VERIFICATION: Project {request.project_id}\n{'='*60}")
    
    temp_file_path = None
    video_file = None
    should_delete_temp = False  # Track if we need to delete temp file
    
    try:
        # 1. Database Check
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # 2. Get Video File Path
        print("📁 Locating video file...")
        
        # Check if URL is local (served by this same server)
        if "localhost:8000" in request.video_url or "127.0.0.1:8000" in request.video_url:
            # Extract filename from URL and read directly from disk
            video_filename = request.video_url.split("/")[-1]
            temp_file_path = os.path.join(BASE_DIR, "static", "uploads", video_filename)
            
            if not os.path.exists(temp_file_path):
                raise HTTPException(status_code=404, detail=f"Video file not found: {video_filename}")
            
            file_size = os.path.getsize(temp_file_path)
            print(f"✅ Found local video: {file_size / 1024 / 1024:.2f} MB")
            
            # We'll use this file directly, no need to copy
            should_delete_temp = False
        else:
            # External URL - download it
            print("📥 Downloading external video...")
            response_video = requests.get(request.video_url, stream=True, timeout=60)
            response_video.raise_for_status()
            
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
            temp_file_path = temp_file.name
            
            with open(temp_file_path, 'wb') as f:
                for chunk in response_video.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            file_size = os.path.getsize(temp_file_path)
            print(f"✅ Video downloaded: {file_size / 1024 / 1024:.2f} MB")
            should_delete_temp = True
        
        # 3. Upload to Gemini
        print("📤 Uploading to Gemini...")
        try:
            video_file = genai.upload_file(
                path=temp_file_path, 
                display_name=f"milestone-{request.project_id}-{request.milestone_index}"
            )
            print(f"✅ Uploaded to Gemini: {video_file.name}")
        except Exception as upload_error:
            print(f"❌ Gemini upload failed: {upload_error}")
            raise Exception(f"Failed to upload video to AI: {str(upload_error)}")
        
        # 4. Wait for processing
        print("⏳ Waiting for Gemini processing...")
        max_wait = 60  # 60 seconds max
        waited = 0
        while video_file.state.name == "PROCESSING":
            if waited >= max_wait:
                raise Exception("Video processing timeout (60s)")
            time.sleep(3)
            waited += 3
            video_file = genai.get_file(video_file.name)
            print(f"   Status: {video_file.state.name} ({waited}s)")
        
        if video_file.state.name == "FAILED":
            raise Exception(f"Gemini video processing failed: {video_file.state}")
        
        print(f"✅ Video ready: {video_file.state.name}")
        
        # 5. Create AI prompt
        prompt = f"""You are verifying construction milestone completion.

Milestone: {request.milestone_criteria}

Instructions:
1. Watch the video carefully
2. Look for evidence of work being done related to this milestone
3. For testing purposes, be lenient - if you see ANY construction activity, tools, or progress, mark as verified
4. Only mark as NOT verified if the video is completely irrelevant, black, or shows no activity

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "verified": true or false,
  "confidence_score": 0-100,
  "reasoning": "Brief explanation of what you saw"
}}"""

        # 6. Call Gemini with retry logic
        print("🤖 Asking Gemini for verification...")
        response = None
        last_error = None
        
        for attempt in range(3):
            try:
                print(f"   Attempt {attempt + 1}/3...")
                
                # Use generate_content with timeout
                response = model.generate_content(
                    [prompt, video_file],
                    request_options={"timeout": 60}
                )
                
                if response and response.text:
                    print(f"✅ Gemini responded (attempt {attempt + 1})")
                    break
                else:
                    print(f"⚠️ Empty response from Gemini")
                    
            except Exception as gen_error:
                last_error = gen_error
                print(f"⚠️ Attempt {attempt + 1} failed: {str(gen_error)[:100]}")
                
                # Check if it's a safety/blocking issue
                if hasattr(response, 'prompt_feedback'):
                    print(f"   Prompt feedback: {response.prompt_feedback}")
                
                if attempt < 2:  # Don't sleep on last attempt
                    time.sleep(5)

        # 7. Check if we got a response
        if not response or not response.text:
            error_msg = f"AI Oracle failed after 3 attempts. Last error: {str(last_error)[:200]}"
            print(f"❌ {error_msg}")
            
            # Return a safe default response instead of crashing
            return VerificationResponse(
                verified=False,
                confidence_score=0,
                reasoning=error_msg,
                error="AI verification service unavailable"
            )

        # 8. Parse response
        print("📝 Parsing AI response...")
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        # Try to find JSON in the response
        try:
            # Look for JSON object in the text
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start >= 0 and end > start:
                json_text = response_text[start:end]
                result = json.loads(json_text)
            else:
                result = json.loads(response_text)
                
        except json.JSONDecodeError as je:
            print(f"❌ JSON parse error: {je}")
            print(f"   Raw response: {response_text[:500]}")
            
            # Fallback: Try to extract key information
            result = {
                "verified": "true" in response_text.lower() or "verified" in response_text.lower(),
                "confidence_score": 50,
                "reasoning": f"Could not parse AI response properly. Raw: {response_text[:200]}"
            }

        print(f"✅ Parsed result: verified={result.get('verified')}, score={result.get('confidence_score')}")

        # 9. Blockchain Payout (if verified)
        if result.get("verified") and result.get("confidence_score", 0) >= 70:
            print("💰 Verification passed! Attempting blockchain payout...")
            
            if project.on_chain_id:
                try:
                    # Trigger the payout
                    tx_hash = await release_funds_mantle(
                        int(project.on_chain_id), 
                        request.milestone_index
                    )
                    
                    if tx_hash:
                        result["mantle_transaction"] = tx_hash
                        result["primary_chain"] = "mantle"
                        
                        # Update local DB status
                        ms = db.query(Milestone).filter(
                            Milestone.project_id == project.id, 
                            Milestone.order_index == request.milestone_index
                        ).first()
                        
                        if ms:
                            ms.status = "verified"
                            ms.is_completed = True
                            db.commit()
                            print("✅ Database updated")
                    else:
                        result["error"] = "AI verified, but blockchain transaction failed"
                        print("❌ Blockchain transaction failed")
                        
                except Exception as blockchain_error:
                    error_msg = f"Blockchain error: {str(blockchain_error)}"
                    result["error"] = error_msg
                    print(f"❌ {error_msg}")
            else:
                result["error"] = "Project not deployed to blockchain"
                print("⚠️ No on_chain_id - skipping blockchain payout")
        else:
            print(f"⏭️ Verification failed or low confidence - no payout")

        return VerificationResponse(**result)
        
    except HTTPException:
        raise
        
    except Exception as e:
        error_msg = str(e)
        print(f"🔥 CRITICAL FAILURE: {error_msg}")
        import traceback
        traceback.print_exc()
        
        # Return structured error instead of crashing
        return VerificationResponse(
            verified=False,
            confidence_score=0,
            reasoning=f"Verification failed: {error_msg[:200]}",
            error=error_msg
        )
        
    finally:
        # Cleanup - only delete if we created a temp file
        if temp_file_path and should_delete_temp and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print("🧹 Cleaned up temp file")
            except:
                pass
        
        # Clean up Gemini file
        if video_file:
            try:
                genai.delete_file(video_file.name)
                print("🧹 Cleaned up Gemini file")
            except:
                pass

        print(f"{'='*60}\n")

@app.post("/verify-milestone", response_model=VerificationResponse)
async def release_funds_mantle(project_on_chain_id: int, milestone_index: int):
    """
    Release milestone funds on Mantle blockchain
    
    Args:
        project_on_chain_id: The on-chain project ID (integer)
        milestone_index: The milestone index FROM YOUR DB (1-based)
    """
    try:
        # Convert to pure integers
        p_id = int(project_on_chain_id)
        m_idx = int(milestone_index) - 1  # DB uses 1-based, blockchain uses 0-based
        
        print(f"🔄 RELEASING: Project {p_id}, Milestone {m_idx} (DB index: {milestone_index})")

        # 1. CRITICAL: Check if milestone exists on-chain first
        try:
            milestone_info = optic_gov_contract.functions.getMilestone(p_id, m_idx).call()
            print(f"📋 Milestone Info: Amount={milestone_info[1]}, Completed={milestone_info[2]}, Released={milestone_info[3]}")
            
            if milestone_info[2]:  # isCompleted
                print(f"⚠️ WARNING: Milestone already marked as completed on-chain")
                if milestone_info[3]:  # isReleased
                    print(f"❌ ERROR: Funds already released for this milestone")
                    return None
        except Exception as e:
            print(f"❌ ERROR: Could not fetch milestone info: {e}")
            print(f"💡 TIP: Make sure project {p_id} exists on-chain with at least {m_idx + 1} milestones")
            return None

        # 2. Get the current nonce
        nonce = w3.eth.get_transaction_count(ORACLE_ADDRESS)

        # 3. FIXED: Let Web3 estimate the gas properly
        # First, try to estimate gas to see what's actually needed
        try:
            estimated_gas = optic_gov_contract.functions.releaseMilestone(
                p_id,
                m_idx,
                True
            ).estimate_gas({
                'from': ORACLE_ADDRESS,
                'nonce': nonce
            })
            print(f"⛽ Estimated Gas: {estimated_gas}")
            # Add 50% buffer to be safe
            gas_limit = int(estimated_gas * 1.5)
        except Exception as est_error:
            print(f"⚠️ Gas estimation failed: {est_error}")
            print(f"💡 Using fallback gas limit of 2,000,000")
            gas_limit = 2_000_000

        # 4. Get current gas price and add buffer for L2
        base_gas_price = w3.eth.gas_price
        gas_price = int(base_gas_price * 1.5)  # 50% buffer for L2 data fees
        
        print(f"⛽ Gas Limit: {gas_limit:,}")
        print(f"💰 Gas Price: {gas_price:,} wei ({w3.from_wei(gas_price, 'gwei'):.2f} gwei)")

        # 5. Build the transaction (Legacy style for Mantle compatibility)
        tx_data = optic_gov_contract.functions.releaseMilestone(
            p_id,
            m_idx,
            True
        ).build_transaction({
            'from': ORACLE_ADDRESS,
            'nonce': nonce,
            'gas': gas_limit,
            'gasPrice': gas_price,
            'chainId': 5003,  # Mantle Sepolia
        })

        # 6. Sign and Broadcast
        signed_tx = w3.eth.account.sign_transaction(tx_data, ORACLE_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = "0x" + tx_hash.hex() if not tx_hash.hex().startswith("0x") else tx_hash.hex()
        
        print(f"🚀 BROADCASTED: {tx_hash_hex}")
        print(f"🔗 View on Explorer: https://sepolia.mantlescan.xyz/tx/{tx_hash_hex}")
        
        # 7. Wait for receipt with longer timeout
        print(f"⏳ Waiting for confirmation...")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
        
        if receipt.status == 1:
            print(f"✅ BLOCKCHAIN CONFIRMED")
            print(f"   Gas Used: {receipt.gasUsed:,}")
            print(f"   Block: {receipt.blockNumber}")
            return "0x" + tx_hash.hex() if not tx_hash.hex().startswith("0x") else tx_hash.hex()
        else:
            print(f"❌ TRANSACTION REVERTED ON-CHAIN")
            print(f"   Receipt: {receipt}")
            return None

    except ValueError as e:
        error_data = str(e)
        print(f"❌ TRANSACTION REJECTED: {error_data}")
        
        # Parse common errors
        if "insufficient funds" in error_data.lower():
            print(f"💡 FIX: Add more MNT to oracle wallet: {ORACLE_ADDRESS}")
        elif "nonce too low" in error_data.lower():
            print(f"💡 FIX: Another transaction is pending. Wait or increase nonce.")
        elif "already known" in error_data.lower():
            print(f"💡 FIX: Transaction already submitted. Check mempool.")
        
        return None
        
    except Exception as e:
        print(f"❌ MANTLE FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return None




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

@app.get("/check-contract-state/{project_id}/{milestone_index}")
async def check_contract_state(project_id: int, milestone_index: int, db: Session = Depends(get_db)):
    """Check contract state for debugging"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.on_chain_id:
        return {"error": "Project not found or no on_chain_id"}
    
    try:
        # Check oracle address
        contract_oracle = optic_gov_contract.functions.oracleAddress().call()
        our_oracle = ORACLE_ADDRESS
        
        # Try to get milestone info
        try:
            milestone_info = optic_gov_contract.functions.getMilestone(
                int(project.on_chain_id),
                milestone_index
            ).call()
        except:
            # Try 0-indexed
            milestone_info = optic_gov_contract.functions.getMilestone(
                int(project.on_chain_id),
                milestone_index - 1
            ).call()
        
        return {
            "project_on_chain_id": project.on_chain_id,
            "milestone_index_tried": milestone_index,
            "contract_oracle": contract_oracle,
            "our_oracle": our_oracle,
            "oracle_match": contract_oracle.lower() == our_oracle.lower(),
            "milestone_info": {
                "description": milestone_info[0],
                "amount_wei": milestone_info[1],
                "amount_mnt": milestone_info[1] / 10**18,
                "isCompleted": milestone_info[2],
                "isReleased": milestone_info[3],
                "evidenceIpfsHash": milestone_info[4]
            }
        }
    except Exception as e:
        return {"error": str(e)}




# ====================
# DEBUGING CONTRACT MILESTONE AMOUNT
# ===================


@app.get("/debug/compare-amounts/{project_id}")
async def compare_milestone_amounts(project_id: int, db: Session = Depends(get_db)):
    """Compare milestone amounts in DB vs blockchain"""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if not project.on_chain_id:
            raise HTTPException(status_code=400, detail="Project not on blockchain")
        
        # Get all milestones from DB
        db_milestones = db.query(Milestone).filter(
            Milestone.project_id == project_id
        ).order_by(Milestone.order_index).all()
        
        # Get blockchain data
        on_chain_id = int(project.on_chain_id)
        project_data = optic_gov_contract.functions.projects(on_chain_id).call()
        milestone_count = project_data[4]
        
        comparison = []
        total_db = 0
        total_blockchain = 0
        
        for i in range(len(db_milestones)):
            db_ms = db_milestones[i]
            
            # Get blockchain milestone
            try:
                bc_ms = optic_gov_contract.functions.getMilestone(on_chain_id, i).call()
                bc_amount_mnt = float(w3.from_wei(bc_ms[1], 'ether'))
                bc_amount_wei = bc_ms[1]
                match = abs(db_ms.amount - bc_amount_mnt) < 0.000001
            except Exception as e:
                bc_amount_mnt = None
                bc_amount_wei = None
                match = False
            
            db_amount_wei = int(db_ms.amount * 10**18)
            total_db += db_ms.amount
            total_blockchain += bc_amount_mnt if bc_amount_mnt else 0
            
            comparison.append({
                "milestone_index": i,
                "order_index": db_ms.order_index,
                "description": db_ms.description[:50],
                "db_amount_mnt": db_ms.amount,
                "db_amount_wei": db_amount_wei,
                "blockchain_amount_mnt": bc_amount_mnt,
                "blockchain_amount_wei": bc_amount_wei,
                "match": match,
                "difference_mnt": (bc_amount_mnt - db_ms.amount) if bc_amount_mnt else None,
                "difference_wei": (bc_amount_wei - db_amount_wei) if bc_amount_wei else None
            })
        
        return {
            "project_id": project_id,
            "on_chain_id": on_chain_id,
            "project_name": project.name,
            "total_budget_db": project.total_budget,
            "total_budget_blockchain": float(w3.from_wei(project_data[2], 'ether')),
            "milestone_count": len(db_milestones),
            "total_milestones_db": total_db,
            "total_milestones_blockchain": total_blockchain,
            "milestones": comparison,
            "warning": "Amounts don't match!" if abs(total_db - total_blockchain) > 0.000001 else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/debug/transaction-receipt/{tx_hash}")
async def get_transaction_details(tx_hash: str):
    """Get detailed transaction receipt"""
    try:
        # Add 0x if missing
        if not tx_hash.startswith("0x"):
            tx_hash = "0x" + tx_hash
        
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        transaction = w3.eth.get_transaction(tx_hash)
        
        # Decode logs to see what actually happened
        logs = []
        for log in receipt.logs:
            try:
                # Try to decode MilestoneReleased event
                decoded = optic_gov_contract.events.MilestoneReleased().process_log(log)
                logs.append({
                    "event": "MilestoneReleased",
                    "projectId": decoded.args.projectId,
                    "milestoneIndex": decoded.args.milestoneIndex,
                    "amount_wei": decoded.args.amount,
                    "amount_mnt": float(w3.from_wei(decoded.args.amount, 'ether'))
                })
            except:
                pass
        
        return {
            "transaction_hash": tx_hash,
            "from": transaction['from'],
            "to": transaction['to'],
            "value_wei": transaction['value'],
            "value_mnt": float(w3.from_wei(transaction['value'], 'ether')),
            "gas_used": receipt.gasUsed,
            "status": "success" if receipt.status == 1 else "failed",
            "block_number": receipt.blockNumber,
            "decoded_events": logs,
            "explorer_url": f"https://sepolia.mantlescan.xyz/tx/{tx_hash}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/sync-project-from-blockchain/{project_id}")
async def sync_project_from_blockchain(project_id: int, db: Session = Depends(get_db)):
    """Sync database milestone amounts with what's actually on the blockchain"""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if not project.on_chain_id:
            raise HTTPException(status_code=400, detail="Project not on blockchain")
        
        on_chain_id = int(project.on_chain_id)
        
        # Get blockchain project data
        project_data = optic_gov_contract.functions.projects(on_chain_id).call()
        milestone_count = project_data[4]
        blockchain_total_budget = float(w3.from_wei(project_data[2], 'ether'))
        
        print(f"\n{'='*60}")
        print(f"🔄 SYNCING PROJECT {project_id} FROM BLOCKCHAIN")
        print(f"{'='*60}")
        
        # Get DB milestones
        db_milestones = db.query(Milestone).filter(
            Milestone.project_id == project_id
        ).order_by(Milestone.order_index).all()
        
        updates = []
        
        for i, db_milestone in enumerate(db_milestones):
            if i >= milestone_count:
                print(f"⚠️ Milestone {i} exists in DB but not on blockchain")
                continue
            
            # Get blockchain milestone
            bc_milestone = optic_gov_contract.functions.getMilestone(on_chain_id, i).call()
            bc_amount = float(w3.from_wei(bc_milestone[1], 'ether'))
            bc_description = bc_milestone[0]
            bc_completed = bc_milestone[2]
            bc_released = bc_milestone[3]
            
            old_amount = db_milestone.amount
            
            # Update database
            db_milestone.amount = bc_amount
            db_milestone.description = bc_description
            
            # Update status based on blockchain state
            if bc_released:
                db_milestone.status = "verified"
                db_milestone.is_completed = True
            elif bc_completed:
                db_milestone.status = "completed"
                db_milestone.is_completed = True
            
            updates.append({
                "milestone_index": i,
                "order_index": db_milestone.order_index,
                "description": bc_description[:50],
                "old_amount": old_amount,
                "new_amount": bc_amount,
                "difference": bc_amount - old_amount,
                "status": db_milestone.status
            })
            
            print(f"✏️ Milestone {i}: {old_amount:.8f} → {bc_amount:.8f} MNT")
        
        # Update project total budget
        old_budget = project.total_budget
        project.total_budget = blockchain_total_budget
        
        db.commit()
        
        print(f"✅ Sync complete!")
        print(f"   Budget: {old_budget:.8f} → {blockchain_total_budget:.8f} MNT")
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            "project_id": project_id,
            "on_chain_id": on_chain_id,
            "old_budget": old_budget,
            "new_budget": blockchain_total_budget,
            "milestones_updated": len(updates),
            "updates": updates
        }
        
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/sync-all-projects")
async def sync_all_projects_from_blockchain(db: Session = Depends(get_db)):
    """Sync all projects that have on_chain_id"""
    try:
        projects = db.query(Project).filter(Project.on_chain_id.isnot(None)).all()
        
        results = []
        for project in projects:
            try:
                result = await sync_project_from_blockchain(project.id, db)
                results.append({"project_id": project.id, "status": "synced", "result": result})
            except Exception as e:
                results.append({"project_id": project.id, "status": "failed", "error": str(e)})
        
        return {
            "total_projects": len(projects),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)