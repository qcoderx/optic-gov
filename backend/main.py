from fastapi import FastAPI, HTTPException, Depends
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
import tempfile
import shutil
import subprocess
import json as json_lib
from geopy.distance import geodesic

load_dotenv()

app = FastAPI(title="Optic-Gov AI Oracle")

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

# Configure Web3
w3 = Web3(Web3.HTTPProvider(os.getenv("SEPOLIA_RPC_URL")))
private_key = os.getenv("ETHEREUM_PRIVATE_KEY")
contract_address = os.getenv("CONTRACT_ADDRESS")

# Verify connections on startup
print(f"Web3 connected: {w3.is_connected()}")
print(f"Contract address: {contract_address}")
print(f"Oracle wallet: {os.getenv('ORACLE_WALLET_ADDRESS')}")
print(f"Gemini API configured: {'✓' if os.getenv('GEMINI_API_KEY') else '✗'}")
print(f"Database URL: {os.getenv('DATABASE_URL')}")

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
    contractor_wallet: str
    use_ai_milestones: bool
    manual_milestones: Optional[List[str]] = None
    project_latitude: float
    project_longitude: float
    location_tolerance_km: float = 1.0

class MilestoneGenerate(BaseModel):
    project_description: str
    total_budget: float

class VerificationResponse(BaseModel):
    verified: bool
    confidence_score: int
    reasoning: str

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
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    # Create project
    db_project = Project(
        name=project.name,
        description=project.description,
        total_budget=project.total_budget,
        contractor_id=contractor.id,
        ai_generated=project.use_ai_milestones,
        project_latitude=project.project_latitude,
        project_longitude=project.project_longitude,
        location_tolerance_km=project.location_tolerance_km
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
    
    # Create milestone records
    milestone_amount = project.total_budget / len(milestone_descriptions)
    for i, desc in enumerate(milestone_descriptions):
        milestone = Milestone(
            project_id=db_project.id,
            description=desc,
            amount=milestone_amount,
            order_index=i + 1
        )
        db.add(milestone)
    
    db.commit()
    return {"project_id": db_project.id, "milestones_created": len(milestone_descriptions)}

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
        
        # If verified, trigger blockchain transaction
        if result["verified"] and result["confidence_score"] >= 95:
            await release_funds(request.project_id, request.milestone_index)
        
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

@app.get("/health")
async def health_check():
    return {"status": "AI Oracle is watching"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)