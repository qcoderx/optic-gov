import { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '@/types';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

  useEffect(() => {
    const checkConnection = async () => {
      // Check for Sui wallet first (priority)
      if (typeof window !== 'undefined' && (window as any).suiWallet) {
        try {
          const accounts = await (window as any).suiWallet.getAccounts();
          if (accounts.length > 0) {
            setWalletState({
              isConnected: true,
              address: accounts[0],
              isConnecting: false,
            });
          }
        } catch (error) {
          console.error('Failed to check Sui wallet:', error);
        }
      }
      // Fallback to Ethereum
      else if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletState({
              isConnected: true,
              address: accounts[0],
              isConnecting: false,
            });
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };
    
    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    // Priority: Try Sui wallet first
    if (typeof window !== 'undefined' && (window as any).suiWallet) {
      setWalletState(prev => ({ ...prev, isConnecting: true, error: undefined }));
      try {
        const result = await (window as any).suiWallet.requestPermissions();
        const accounts = await (window as any).suiWallet.getAccounts();
        
        if (accounts.length > 0) {
          setWalletState({
            isConnected: true,
            address: accounts[0],
            isConnecting: false,
          });
          localStorage.setItem('walletConnected', 'sui');
          return;
        }
      } catch (error) {
        console.error('Sui wallet connection failed:', error);
      }
    }

    // Fallback: Ethereum/MetaMask
    if (typeof window.ethereum === 'undefined') {
      setWalletState(prev => ({
        ...prev,
        error: 'No wallet detected. Please install Sui Wallet or MetaMask',
      }));
      return;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true, error: undefined }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletState({
          isConnected: true,
          address: accounts[0],
          isConnecting: false,
        });
        localStorage.setItem('walletConnected', 'ethereum');
      }
    } catch (error) {
      setWalletState({
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      });
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      isConnecting: false,
      address: undefined,
      error: undefined,
    });
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnected');
    }
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};