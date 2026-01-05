import { useState, useEffect } from 'react';
import { walletService } from '@/services/walletService';

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedAddress = walletService.getAddress();
    if (savedAddress) {
      setAddress(savedAddress);
      setIsConnected(true);
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          localStorage.setItem('wallet_address', accounts[0]);
        } else {
          setAddress(null);
          setIsConnected(false);
          localStorage.removeItem('wallet_address');
        }
      });
    }
  }, []);

  const connect = async () => {
    try {
      console.log('Attempting to connect wallet...');
      const addr = await walletService.connectWallet();
      console.log('Wallet connected:', addr);
      setAddress(addr);
      setIsConnected(true);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect wallet. Please make sure MetaMask is installed.');
      throw error;
    }
  };

  const disconnect = () => {
    walletService.disconnect();
    setAddress(null);
    setIsConnected(false);
  };

  return {
    address,
    isConnected,
    connect,
    disconnect,
  };
};
