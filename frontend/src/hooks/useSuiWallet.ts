import { useCurrentAccount, useSignAndExecuteTransaction, useDisconnectWallet, useConnectWallet } from '@mysten/dapp-kit';

export const useSuiWallet = () => {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: connect } = useConnectWallet();

  return {
    address: account?.address,
    isConnected: !!account,
    signAndExecute,
    disconnect,
    connect,
  };
};
