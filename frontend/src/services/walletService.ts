import { ethers } from 'ethers';

const MANTLE_CHAIN_ID = 5003;

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;

  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await this.provider.send('eth_requestAccounts', []);
    
    const network = await this.provider.getNetwork();
    if (Number(network.chainId) !== MANTLE_CHAIN_ID) {
      await this.switchToMantle();
    }

    const address = accounts[0];
    localStorage.setItem('wallet_address', address);
    return address;
  }

  private async switchToMantle() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${MANTLE_CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${MANTLE_CHAIN_ID.toString(16)}`,
            chainName: 'Mantle Sepolia Testnet',
            nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
            blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz']
          }],
        });
      } else {
        throw error;
      }
    }
  }

  async getBalance(): Promise<string> {
    const address = this.getAddress();
    if (!address || !this.provider) return '0';
    
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  getAddress(): string | null {
    return localStorage.getItem('wallet_address');
  }

  disconnect(): void {
    this.provider = null;
    localStorage.removeItem('wallet_address');
  }
}

export const walletService = new WalletService();