import { ConnectButton } from '@mysten/dapp-kit';

export const SuiConnectButton = () => {
  return (
    <ConnectButton 
      connectText="Connect Sui Wallet"
      className="bg-[#38e07b] hover:bg-[#22c565] text-[#111814] font-bold px-6 py-2 rounded-full"
    />
  );
};
