#!/usr/bin/env python3
import requests
import json

# Test data
test_project = {
    "name": "Test Road Construction",
    "description": "Building a 2km road in Lagos",
    "total_budget": 5000000,
    "budget_currency": "NGN",
    "contractor_wallet": "0x1234567890123456789012345678901234567890",
    "use_ai_milestones": True,
    "project_latitude": 6.5244,
    "project_longitude": 3.3792,
    "location_tolerance_km": 1.0,
    "gov_wallet": "0x0987654321098765432109876543210987654321",
    "on_chain_id": "0x123abc"
}

# Test local backend
print("Testing deployed backend...")
try:
    response = requests.post(
        "https://optic-gov.onrender.com/create-project",
        json=test_project,
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", str(e))