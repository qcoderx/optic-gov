# OracleCap Setup Guide

## Critical: Backend Oracle Authorization

The backend needs the `OracleCap` object to release funds. Follow these steps after deploying the contract:

### Step 1: Deploy the Contract
```bash
sui client publish --gas-budget 100000000
```

Note the:
- **Package ID** (e.g., `0xabc123...`)
- **OracleCap Object ID** (created in the transaction)

### Step 2: Get Backend Oracle Address
```bash
# In backend directory
python3 -c "
from pysui.sui.sui_crypto import recover_key_and_address
import os
from dotenv import load_dotenv

load_dotenv()
mnemonic = os.getenv('SUI_ORACLE_MNEMONIC')
_, kp, addr_obj = recover_key_and_address(
    keytype=0,
    mnemonics=mnemonic,
    derv_path=\"m/44'/784'/0'/0'/0'\"
)
print(f'Backend Oracle Address: {addr_obj.address}')
"
```

### Step 3: Transfer OracleCap to Backend
```bash
# From the deployer wallet, transfer the OracleCap
sui client transfer \
  --to <BACKEND_ORACLE_ADDRESS> \
  --object-id <ORACLE_CAP_OBJECT_ID> \
  --gas-budget 10000000
```

### Step 4: Update Backend .env
```bash
# Add to backend/.env
SUI_PACKAGE_ID=0xabc123...
SUI_ORACLE_CAP_ID=0xdef456...
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_ORACLE_MNEMONIC=your twelve word mnemonic here
```

### Step 5: Verify Backend Can Access Cap
```bash
# In backend directory
python3 -c "
from main import sui_client
import os

cap_id = os.getenv('SUI_ORACLE_CAP_ID')
result = sui_client.get_object(cap_id)
print(f'OracleCap accessible: {result.is_ok()}')
"
```

## Security Notes

- **NEVER** commit the `SUI_ORACLE_MNEMONIC` to git
- The OracleCap holder has full control over fund releases
- Keep the backend server secure and access-controlled
- Consider multi-sig for production deployments

## Troubleshooting

**Error: "OracleCap not found"**
- Verify the cap was transferred to the correct address
- Check `SUI_ORACLE_CAP_ID` matches the actual object ID

**Error: "Insufficient permissions"**
- The backend wallet must own the OracleCap object
- Re-run Step 3 to transfer ownership

**Error: "Wrong network"**
- Ensure frontend `VITE_SUI_NETWORK` matches backend `SUI_RPC_URL`
- Both must be on same network (testnet/mainnet/devnet)
