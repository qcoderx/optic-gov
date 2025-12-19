import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

export class WalletService {
  private client: SuiClient;
  private keypair: Ed25519Keypair | null = null;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl('testnet') });
  }

  async connectWallet(): Promise<string> {
    try {
      // Generate or connect to wallet
      this.keypair = Ed25519Keypair.generate();
      const address = this.keypair.getPublicKey().toSuiAddress();
      
      // Store in localStorage for persistence
      localStorage.setItem('sui_wallet_address', address);
      
      return address;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  async getBalance(): Promise<number> {
    if (!this.keypair) throw new Error('Wallet not connected');
    
    try {
      const address = this.keypair.getPublicKey().toSuiAddress();
      const balance = await this.client.getBalance({ owner: address });
      return parseInt(balance.totalBalance) / 1000000000; // Convert from MIST to SUI
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  async signTransaction(tx: TransactionBlock): Promise<any> {
    if (!this.keypair) throw new Error('Wallet not connected');
    
    try {
      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });
      
      return result;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }

  getAddress(): string | null {
    if (this.keypair) {
      return this.keypair.getPublicKey().toSuiAddress();
    }
    return localStorage.getItem('sui_wallet_address');
  }

  disconnect(): void {
    this.keypair = null;
    localStorage.removeItem('sui_wallet_address');
  }
}

export const walletService = new WalletService();