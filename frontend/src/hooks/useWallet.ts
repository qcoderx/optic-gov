import { useAccount, useDisconnect, useBalance } from 'wagmi';

export const useWallet = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Example: Getting balance on Mantle Sepolia automatically
  const { data: balance } = useBalance({
    address: address,
  });

  return {
    address,
    isConnected,
    balance: balance?.formatted,
    symbol: balance?.symbol,
    disconnect: () => disconnect(),
  };
};