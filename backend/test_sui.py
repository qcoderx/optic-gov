import os
from dotenv import load_dotenv

# Correct imports for pysui 0.65.0
from pysui import SyncClient, SuiConfig, handle_result
from pysui.sui.sui_crypto import recover_key_and_address
from pysui.sui.sui_txn import SyncTransaction

load_dotenv()

def test_oracle_signing():
    rpc_url = os.getenv("SUI_RPC_URL")
    mnemonic = os.getenv("SUI_ORACLE_MNEMONIC")
    
    print(f"--- Oracle Connection Test (v0.65.0) ---")
    
    try:
        # 1. Recover Keypair (Scheme 0 = ED25519)
        _, kp, addr_obj = recover_key_and_address(
            keytype=0, 
            mnemonics=mnemonic, 
            derv_path="m/44'/784'/0'/0'/0'"
        )
        print(f"✅ Recovered Address: {addr_obj.address}")
        
        # 2. Setup Config and Client (using user_config)
        cfg = SuiConfig.user_config(
            rpc_url=rpc_url, 
            prv_keys=[kp.serialize()]
        )
        client = SyncClient(cfg)
        
        # 3. Create transaction using SyncTransaction
        txn = SyncTransaction(client=client)
        
        # Split coins from gas and transfer to self
        split_coin = txn.split_coin(coin=txn.gas, amounts=[1000])
        txn.transfer_objects(transfers=[split_coin], recipient=client.config.active_address)
        
        print("Executing test transaction...")
        result = txn.execute(gas_budget="10000000")

        if result.is_ok():
            print(f"✅ SUCCESS! Digest: {result.result_data.digest}")
            print("Oracle is authorized and ready to sign.")
        else:
            error_msg = result.result_string
            print(f"❌ FAILED: {error_msg}")
            if "InsufficientCoinBalance" in error_msg or "GasBalanceTooLow" in error_msg:
                print("\n⚠️  NOTICE: Your wallet is empty. You need Testnet SUI to sign.")
                print(f"Go to Discord or a faucet and use: {addr_obj.address}")

    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_oracle_signing()