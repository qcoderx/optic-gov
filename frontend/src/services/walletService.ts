import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

export class WalletService {
  private client: SuiClient;
  private signAndExecuteFn: any = null;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl('testnet') });
  }

  setSignAndExecute(fn: any) {
    this.signAndExecuteFn = fn;
  }

  async connectWallet(): Promise<string> {
    try {
      if (typeof window !== 'undefined' && (window as any).suiWallet) {
        await (window as any).suiWallet.requestPermissions();
        const accounts = await (window as any).suiWallet.getAccounts();
        
        if (accounts.length > 0) {
          const address = accounts[0];
          localStorage.setItem('sui_wallet_address', address);
          return address;
        }
      }
      
      throw new Error('No Sui wallet detected. Please install Sui Wallet, Suiet, or Ethos.');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  async getBalance(): Promise<number> {
    const address = this.getAddress();
    if (!address) throw new Error('Wallet not connected');
    
    try {
      const balance = await this.client.getBalance({ owner: address });
      return parseInt(balance.totalBalance) / 1000000000;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  getSigner(): any {
    return this.signAndExecuteFn ? {
      signAndExecuteTransactionBlock: this.signAndExecuteFn
    } : null;
  }

  getAddress(): string | null {
    return localStorage.getItem('sui_wallet_address');
  }

  disconnect(): void {
    this.signAndExecuteFn = null;
    localStorage.removeItem('sui_wallet_address');
  }
}

export const walletService = new WalletService();