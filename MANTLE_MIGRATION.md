# Mantle Sepolia Integration - Migration Summary

## Changes Made

### 1. Dependencies Updated
**File**: `frontend/package.json`
- Removed: `@mysten/dapp-kit`, `@mysten/sui.js`
- Added: `ethers@^6.13.0`

### 2. New Service Files Created

#### `frontend/src/services/mantleService.ts`
- Handles all Mantle blockchain interactions
- Functions:
  - `connectWallet()`: Connects MetaMask and switches to Mantle Sepolia
  - `createProject()`: Deploys project to blockchain with payable transaction
  - `submitEvidence()`: Submits milestone evidence IPFS hash
  - `getProjectState()`: Reads project data from blockchain
- Configuration:
  - Chain ID: 5003 (Mantle Sepolia)
  - RPC URL: https://rpc.sepolia.mantle.xyz
  - Contract: 0x25b4C5e58BdF3124095aD925fd480eD5D17e9e64

#### `frontend/src/hooks/useWallet.ts`
- React hook for wallet connection state management
- Handles account changes via window.ethereum events
- Replaces `useSuiWallet` hook

#### `frontend/src/types/ethereum.d.ts`
- TypeScript declarations for window.ethereum

### 3. Updated Service Files

#### `frontend/src/services/walletService.ts`
- Complete rewrite for Ethereum/Mantle
- Uses ethers.js BrowserProvider
- Auto-switches to Mantle Sepolia network
- Prompts user to add network if not present

#### `frontend/src/services/projectService.ts`
- Updated `createProject()` method:
  1. Creates project in database first
  2. Calls `mantleService.createProject()` with MNT value
  3. Retrieves blockchain projectId from event
  4. Updates database with on_chain_id via PUT endpoint

### 4. Updated Component Files

#### `frontend/src/components/pages/MilestoneVerificationPage.tsx`
- Replaced `useSuiWallet` with `useWallet`
- Replaced `ConnectButton` from @mysten/dapp-kit with custom button

#### `frontend/src/components/pages/ContractorDashboard.tsx`
- Replaced `useSuiWallet` with `useWallet`

### 5. Environment Configuration

#### `frontend/.env.production`
```
VITE_API_URL=https://optic-gov.onrender.com
VITE_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
VITE_CONTRACT_ADDRESS=0x25b4C5e58BdF3124095aD925fd480eD5D17e9e64
VITE_GEMINI_API_KEY=
```

#### `frontend/.env.example`
```
VITE_API_URL=http://localhost:8000
VITE_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
VITE_CONTRACT_ADDRESS=0x25b4C5e58BdF3124095aD925fd480eD5D17e9e64
VITE_GEMINI_API_KEY=
```

## Files to Delete

The following Sui-related files should be deleted:
- `frontend/src/services/suiService.ts`
- `frontend/src/hooks/useSuiWallet.ts`

## Next Steps

1. Run `npm install` in frontend directory to install ethers.js
2. Delete Sui-related files listed above
3. Test wallet connection with MetaMask
4. Test project creation flow end-to-end
5. Verify on_chain_id is saved correctly to database

## Key Implementation Details

### Project Creation Flow
1. Frontend calls backend `/create-project` endpoint
2. Backend creates project in Postgres, returns `project_id`
3. Frontend calls `mantleService.createProject()`:
   - Converts budget to Wei (18 decimals)
   - Sends payable transaction with MNT value
   - Waits for transaction receipt
   - Extracts `projectId` from `ProjectCreated` event
4. Frontend calls backend `PUT /projects/{id}/on-chain-id` to save blockchain ID
5. Database now has both database ID and blockchain ID linked

### Currency Handling
- Budget input: NGN (Nigerian Naira)
- Backend converts: NGN → MNT
- Blockchain stores: Wei (MNT * 10^18)
- Display: Shows both NGN and MNT equivalents

## Contract ABI Used
Only essential functions included:
- `createProject(address, uint256[], string[]) payable returns (uint256)`
- `releaseMilestone(uint256, uint256, bool)`
- `submitEvidence(uint256, uint256, string)`
- `getMilestone(uint256, uint256) view`
- `projects(uint256) view`
- Event: `ProjectCreated(uint256 indexed projectId, ...)`
