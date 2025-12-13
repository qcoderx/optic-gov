import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const navigation = [
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Features', href: '#features' },
  { name: 'Transparency Map', href: '/transparency-map' },
  { name: 'Docs', href: '#docs' },
];

export const Header = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
          console.log('Wallet connected:', accounts[0]);
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      console.log('Please install MetaMask!');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
  };

  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
        } else {
          setIsConnected(false);
          setAddress(null);
        }
      });
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-solid border-border-dark bg-background-dark/80 backdrop-blur-md">
      <div className="layout-container">
        <div className="flex items-center justify-between w-full max-w-[1280px] px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3 text-white">
            <div className="size-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Icon name="verified_user" />
            </div>
            <h2 className="text-white text-xl font-bold tracking-tight">
              Optic-Gov
            </h2>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              item.href.startsWith('/') ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors focus:outline-none focus:text-white"
                >
                  {item.name}
                </a>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors focus:outline-none focus:text-white"
                >
                  {item.name}
                </a>
              )
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors hidden sm:block focus:outline-none focus:text-white"
              aria-label="GitHub Repository"
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fillRule="evenodd"
                />
              </svg>
            </a>

            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  <Icon name="account_balance_wallet" size="sm" />
                  <span className="truncate">{formatAddress(address)}</span>
                </Button>
                <Button
                  onClick={disconnectWallet}
                  variant="secondary"
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  title="Disconnect Wallet"
                >
                  <Icon name="logout" size="sm" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                loading={isConnecting}
                className="shadow-primary"
              >
                <Icon name="account_balance_wallet" size="sm" />
                <span className="truncate">Connect Wallet</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};