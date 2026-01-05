# UI Text Updates - SUI to Mantle Migration

## Summary
Updated all user-facing text references from SUI blockchain to Mantle Sepolia (Ethereum Layer 2).

## Key Changes

### Currency References
- **SUI → MNT** (Mantle native token)
- All budget displays now show MNT instead of SUI
- Currency input components updated to use MNT

### Network References
- **"Sui Mainnet" → "Mantle Sepolia"**
- **"Sui Testnet" → "Mantle Sepolia"**
- **"Sepolia Testnet" → "Mantle Sepolia"**

### Explorer Links
- **SUIerscan → Mantle Explorer**
- Updated URLs: `https://explorer.sepolia.mantle.xyz/tx/{hash}`

### Branding Text
- **"Secured by AI & Sui" → "Secured by AI & Mantle"**
- **"SECURED WITH SUI" → "SECURED WITH MANTLE"**
- **"Sui Smart Contracts" → "Mantle Smart Contracts"**
- **"SUIereum" → "Mantle L2"**

### Technical References
- **"Sui Object ID" → "Mantle blockchain project ID"**
- **"Sui address" → "Ethereum address"**
- **"sui_transaction" → "ethereum_transaction"**

## Files Updated

### Pages
1. **HeroSection.tsx**
   - "Now Live on Mantle Sepolia"
   - "MNT Released" instead of "SUI Released"

2. **LoginPage.tsx**
   - "Mantle Smart Contracts" in description
   - "Secured by AI & Mantle" badge

3. **RegisterPage.tsx**
   - "SECURED WITH MANTLE" trust badge

4. **GovernorDashboardPage.tsx**
   - Currency type: `'NGN' | 'MNT'`
   - Network display: "Mantle Sepolia"

5. **MilestoneVerificationPage.tsx**
   - Budget display in MNT
   - "View on Mantle Explorer" link
   - "Mantle L2" in footer
   - Transaction hash from `ethereum_transaction`

### Components
6. **CurrencyInput.tsx**
   - Type definitions: `'NGN' | 'MNT'`
   - Conversion logic updated for MNT

### Types
7. **project.ts**
   - `total_budget_mnt` instead of `total_budget_sui`
   - `budget_currency: 'NGN' | 'MNT'`
   - Comments updated to reference Mantle and Ethereum

## Remaining References

### Backend-Related (Keep as-is for now)
These files still reference SUI in service layer for backend compatibility:
- `currencyService.ts` - Backend API still uses `/convert/ngn-to-sui` endpoint
- `exchangeService.ts` - Backend API endpoints unchanged
- `aiService.ts` - Field name `sui_transaction` for backend compatibility

### To Update Later
- `StatsHUD.tsx` - Dashboard stats still show "SUI Locked/Released"
- `TransparencyMapPage.tsx` - Mock data shows "SUI" in budgets
- `ConnectionStatus.tsx` - Network status check still references SUI
- `CurrencyDisplay.tsx` - Display logic references SUI

## User-Visible Impact
✅ All critical user-facing pages now show Mantle branding
✅ Currency displays show MNT instead of SUI
✅ Network references updated to Mantle Sepolia
✅ Explorer links point to Mantle block explorer
✅ Transaction notifications use Mantle transaction hashes

## Testing Checklist
- [ ] Hero section displays "Mantle Sepolia"
- [ ] Login page shows "Mantle Smart Contracts"
- [ ] Registration shows "SECURED WITH MANTLE"
- [ ] Governor dashboard shows "Mantle Sepolia" network
- [ ] Milestone verification shows MNT currency
- [ ] Explorer links open Mantle Sepolia explorer
- [ ] Transaction notifications show correct Mantle tx hash
