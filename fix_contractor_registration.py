#!/usr/bin/env python3
"""
Quick fix script to register the contractor before creating projects
"""
import requests
import json

API_BASE_URL = "http://localhost:8000"

def register_contractor():
    """Register the contractor with the wallet address from your form"""
    contractor_data = {
        "wallet_address": "0xbf419246425e6ef3c0a937e3998d98452d651ada2ddeadd19f7677d72cf616d9",
        "company_name": "Bariga Construction Ltd",
        "email": "contractor@bariga.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/register", json=contractor_data)
        
        if response.status_code == 200:
            print("✅ Contractor registered successfully!")
            return True
        elif response.status_code == 400 and "already registered" in response.text:
            print("✅ Contractor already exists!")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_project_creation():
    """Test creating a project after contractor registration"""
    project_data = {
        "name": "A bridge in bariga",
        "description": "Infrastructure project for bridge construction",
        "total_budget": 10000,
        "budget_currency": "NGN",
        "contractor_wallet": "0xbf419246425e6ef3c0a937e3998d98452d651ada2ddeadd19f7677d72cf616d9",
        "use_ai_milestones": True,
        "project_latitude": 6.5244,
        "project_longitude": 3.3792,
        "location_tolerance_km": 1.0,
        "gov_wallet": "0x12...89",
        "on_chain_id": "0x" + hex(12345)[2:]  # Generate a proper hex ID
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/create-project", json=project_data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Project created successfully!")
            print(f"Project ID: {result['project_id']}")
            print(f"Milestones created: {result['milestones_created']}")
            return True
        else:
            print(f"❌ Project creation failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Fixing contractor registration issue...")
    
    # Step 1: Register contractor
    if register_contractor():
        print("\n🚀 Testing project creation...")
        # Step 2: Test project creation
        test_project_creation()
    else:
        print("❌ Cannot proceed without contractor registration")