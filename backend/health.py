import os
import sys
from web3 import Web3
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def run_health_check():
    print("🚀 Starting Optic-Gov Health Check...\n")
    all_passed = True

    # 1. Check Mantle RPC
    print("--- [1/3] Checking Mantle Sepolia RPC ---")
    w3 = Web3(Web3.HTTPProvider(os.getenv("MANTLE_RPC_URL")))
    if w3.is_connected():
        chain_id = w3.eth.chain_id
        block_number = w3.eth.block_number
        print(f"✅ Connected! Chain ID: {chain_id} | Latest Block: {block_number}")
    else:
        print("❌ FAILED: Cannot connect to Mantle RPC. Check your MANTLE_RPC_URL.")
        all_passed = False

    # 2. Check Smart Contract
    print("\n--- [2/3] Checking Smart Contract Deployment ---")
    contract_address = os.getenv("CONTRACT_ADDRESS")
    if contract_address:
        code = w3.eth.get_code(Web3.to_checksum_address(contract_address))
        if code and code != w3.to_bytes(hexstr="0x"):
            print(f"✅ Verified! Contract exists at {contract_address}")
            
            # Check Oracle Balance (to ensure it can pay gas)
            oracle_address = w3.eth.account.from_key(os.getenv("ETHEREUM_PRIVATE_KEY")).address
            balance = w3.eth.get_balance(oracle_address)
            print(f"💰 Oracle Wallet: {oracle_address}")
            print(f"💰 Oracle Balance: {w3.from_wei(balance, 'ether')} MNT")
            if balance == 0:
                print("⚠️ WARNING: Oracle wallet is empty. Verification will fail gas checks.")
        else:
            print(f"❌ FAILED: No contract code found at {contract_address}. Did you deploy to the right network?")
            all_passed = False
    else:
        print("❌ FAILED: CONTRACT_ADDRESS is missing in .env")
        all_passed = False

    # 3. Check Neon Database
    print("\n--- [3/3] Checking Neon Postgres Database ---")
    try:
        engine = create_engine(os.getenv("DATABASE_URL"))
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Connection Successful! Database is ready.")
    except Exception as e:
        print(f"❌ FAILED: Database connection error: {e}")
        all_passed = False

    print("\n" + "="*40)
    if all_passed:
        print("🎉 ALL SYSTEMS GO! You are ready for the demo.")
        sys.exit(0)
    else:
        print("🛠️  ISSUES DETECTED: Fix the errors above before running main.py.")
        sys.exit(1)

if __name__ == "__main__":
    run_health_check()