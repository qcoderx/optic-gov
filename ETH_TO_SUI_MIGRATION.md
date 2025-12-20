# ETH → SUI Migration Plan

## CRITICAL: Remove ALL Ethereum references, use ONLY Sui

### Backend Changes (main.py)
- [ ] Remove Web3 imports and initialization
- [ ] Replace `eth_ngn_cache` → `sui_ngn_cache`
- [ ] Replace `get_eth_ngn_rate()` → `get_sui_ngn_rate()` (use SUI price from CoinGecko)
- [ ] Replace `convert_ngn_to_eth()` → `convert_ngn_to_sui()`
- [ ] Replace `convert_eth_to_ngn()` → `convert_sui_to_ngn()`
- [ ] Update ProjectCreate model: `budget_currency: "NGN" | "SUI"`
- [ ] Update CurrencyConversion model: `sui_amount` instead of `eth_amount`
- [ ] Update all API endpoints to use SUI
- [ ] Remove Ethereum fallback code in verify_milestone
- [ ] Remove release_funds() function (Ethereum only)
- [ ] Update all endpoint responses to use `budget_sui` instead of `budget_eth`

### Frontend Changes
**Services:**
- [ ] currencyService.ts: Replace all ETH methods with SUI
- [ ] projectService.ts: Replace `total_budget_eth` → `total_budget_sui`

**Types:**
- [ ] project.ts: Replace `total_budget_eth` → `total_budget_sui`
- [ ] project.ts: Replace `budget_currency: 'NGN' | 'ETH'` → `'NGN' | 'SUI'`
- [ ] index.ts: Replace `ethReleased` → `suiReleased`

**Components (ALL pages):**
- [ ] Replace "ETH" text → "SUI"
- [ ] Replace "Ethereum" text → "Sui"
- [ ] Replace "Etherscan" links → "Sui Explorer" links
- [ ] Update all currency displays

### Database
- [ ] No schema changes needed (amounts are stored as floats)

### Priority Files to Update:
1. backend/main.py (CRITICAL)
2. frontend/src/services/currencyService.ts
3. frontend/src/types/project.ts
4. All page components with ETH references

Would you like me to proceed with the full migration?
