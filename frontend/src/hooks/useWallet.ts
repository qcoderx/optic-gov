import { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '@/types';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
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
    if (typeof window.ethereum === 'undefined') {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed',
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
        
        // Store connection state
        if (typeof window !== 'undefined') {
          localStorage.setItem('walletConnected', 'true');
        }
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
    
    // Clear any stored wallet data
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