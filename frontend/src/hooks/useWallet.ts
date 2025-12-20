import { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '@/types';
import { useSuiWallet } from './useSuiWallet';

export const useWallet = () => {
  const { address: suiAddress, isConnected: suiConnected, connect, disconnect } = useSuiWallet();
  
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

  useEffect(() => {
    if (suiConnected && suiAddress) {
      setWalletState({
        isConnected: true,
        address: suiAddress,
        isConnecting: false,
      });
    } else {
      setWalletState({
        isConnected: false,
        isConnecting: false,
      });
    }
  }, [suiConnected, suiAddress]);

  const connectWallet = useCallback(async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: undefined }));
    try {
      connect({ wallet: { name: 'Sui Wallet' } }, {
        onSuccess: () => {
          setWalletState(prev => ({ ...prev, isConnecting: false }));
        },
        onError: (error) => {
          setWalletState({
            isConnected: false,
            isConnecting: false,
            error: 'Failed to connect Sui wallet. Please install Sui Wallet or Slush.',
          });
        }
      });
    } catch (error) {
      setWalletState({
        isConnected: false,
        isConnecting: false,
        error: 'Failed to connect wallet',
      });
    }
  }, [connect]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setWalletState({
      isConnected: false,
      isConnecting: false,
      address: undefined,
      error: undefined,
    });
  }, [disconnect]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};