# CRITICAL ARCHITECTURE NOTES

## ✅ FIXED: Type Mismatch Bug

**Issue**: `on_chain_id` was defined as `number` in TypeScript but Sui Object IDs are hex strings.

**Fix Applied**: Changed to `string` in:
- `frontend/src/types/project.ts` - Project interface
- `frontend/src/types/project.ts` - ProjectCreateRequest interface

## Data Architecture (Hybrid On-Chain/Off-Chain)

### PostgreSQL Database (Off-Chain)
Stores:
- Project metadata (name, description, location)
- Contractor information
- **Milestones** (descriptions, amounts, order)
- Milestone status tracking
- Project-to-contractor relationships

### Sui Blockchain (On-Chain)
Stores:
- Escrow balance (locked SUI funds)
- `funds_released` (total paid out)
- `latest_evidence_ipfs` (last submitted proof)
- `contractor` address (payout recipient)
- `funder` address (who funded the project)

### Critical Sync Points

1. **Project Creation**:
   - Backend creates DB record
   - Frontend creates on-chain project
   - Frontend sends `on_chain_id` back to backend
   - Backend updates DB with `on_chain_id`

2. **Milestone Verification**:
   - Contractor submits evidence to blockchain FIRST
   - Backend verifies with Gemini AI
   - Backend releases funds on-chain if verified
   - Backend updates milestone status in DB

3. **Truth Sources**:
   - **Milestone Progress**: PostgreSQL is source of truth
   - **Fund Status**: Sui blockchain is source of truth
   - **Evidence**: Sui blockchain stores IPFS hash

## Contractor Address Validation

**CRITICAL**: The `contractor_wallet` MUST be a valid Sui address.

### Sui Address Format
- Hex string starting with `0x`
- 64 characters after `0x` (32 bytes)
- Example: `0x3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b`

### Risk
If contractor registers with Ethereum address:
- Ethereum: 40 hex chars (20 bytes)
- Sui: 64 hex chars (32 bytes)
- Transaction will FAIL or funds LOST

### Recommendation
Add validation in backend `/register` endpoint:
```python
def validate_sui_address(address: str) -> bool:
    return address.startswith('0x') and len(address) == 66  # 0x + 64 chars
```

## Database Wipe Risk

**WARNING**: If PostgreSQL is wiped:
- Milestone definitions are LOST
- Backend cannot determine which milestone to verify
- Funds remain LOCKED on Sui forever
- Smart contract has NO milestone metadata

**Mitigation**:
1. Regular database backups
2. Consider storing milestone count on-chain
3. Or emit events for each milestone definition

## Environment Variables Verified

Backend `.env` contains:
```
SUI_PACKAGE_ID=0xd38525a55e524a8fa3f7cc1991934685f90dc57bc6b5f1418d04921cb080ef2d
SUI_ORACLE_CAP_ID=0xf246f0d0f312ed8c5e6a781bf1d3139649505a9326b2468ff1869dd1c48073b3
SUI_ORACLE_MNEMONIC=bird claim fun weasel safe spray expand winner hover inside wrestle cycle
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

**Action Required**:
1. Verify `SUI_PACKAGE_ID` matches deployed contract
2. Verify `SUI_ORACLE_CAP_ID` is owned by Oracle address
3. Test Oracle can call `release_payment`

## Frontend Environment Variables Needed

Create `frontend/.env`:
```
VITE_SUI_NETWORK=testnet
VITE_SUI_PACKAGE_ID=0xd38525a55e524a8fa3f7cc1991934685f90dc57bc6b5f1418d04921cb080ef2d
VITE_API_URL=https://optic-gov.onrender.com
```
