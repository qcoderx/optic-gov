import { useState, useCallback } from 'react';
import type { WalletState } from '@/types';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

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
    });
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};