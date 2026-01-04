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
      const addr = await walletService.connectWallet();
      setAddress(addr);
      setIsConnected(true);
    } catch (error) {
      console.error('Wallet connection failed:', error);
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
