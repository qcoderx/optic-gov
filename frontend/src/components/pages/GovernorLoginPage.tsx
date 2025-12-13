import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const GovernorLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      console.log('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogin = () => {
    if (!walletConnected) {
      console.log('Please connect your wallet first!');
      return;
    }
    navigate('/governor/dashboard');
  };

  return (
    <div className="bg-[#102216] min-h-screen flex flex-col font-display">
      {/* Header */}
      <header className="w-full border-b border-[#28392e] bg-[#102216]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3 text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="w-8 h-8 text-primary"
              animate={{ 
                rotateY: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotateY: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Icon name="policy" />
            </motion.div>
            <motion.h1 
              className="text-white text-xl font-bold tracking-tight"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Optic-Gov
            </motion.h1>
          </motion.div>
          
          <motion.a 
            href="/transparency-map" 
            className="text-[#9cbaa6] text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Icon name="visibility" size="sm" />
            Public Dashboard
          </motion.a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Background Effects */}
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div 
          className="w-full max-w-[1080px] bg-[#1b271f] border border-[#28392e] rounded-xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px] z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Left Side: Visuals & Info */}
          <div className="w-full lg:w-1/2 p-10 lg:p-14 bg-[#141f18] flex flex-col justify-between relative border-r border-[#28392e]">
            <div className="z-10">
              <motion.div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(13, 242, 89, 0.3)"
                }}
              >
                <motion.span 
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Governor Access Portal
                </motion.span>
              </motion.div>
              
              <h2 className="text-white text-4xl lg:text-5xl font-black leading-tight tracking-[-0.033em] mb-4">
                <TypewriterText text="Govern with" speed={100} />
                <br />
                <span className="text-[#9cbaa6]">
                  <TypewriterText text="Transparency" delay={1500} speed={120} />
                </span>
              </h2>
              
              <p className="text-[#9cbaa6] text-lg font-normal leading-relaxed max-w-sm">
                <TypewriterText 
                  text="Access your governor dashboard to create projects, manage contracts, and oversee public infrastructure with blockchain accountability."
                  delay={3000}
                  speed={40}
                />
              </p>
            </div>

            <motion.div 
              className="relative h-64 w-full mt-8 rounded-lg overflow-hidden border border-[#28392e] group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.img 
                alt="Government building with blockchain overlay"
                className="object-cover w-full h-full opacity-60 mix-blend-overlay"
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&q=80"
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 0.8, 0.6]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-[#141f18] to-transparent"
                animate={{ opacity: [0.8, 0.6, 0.8] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-4 left-4 text-xs text-[#9cbaa6] flex items-center gap-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Icon name="account_balance" size="sm" />
                </motion.div>
                Secured Governor Portal
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-14 flex flex-col justify-center bg-[#1b271f]">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="mb-8">
                <h3 className="text-white text-2xl font-bold mb-2">Governor Sign In</h3>
                <p className="text-[#9cbaa6] text-sm">Access your governance dashboard</p>
              </div>

              <div className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#29382f] border border-[#29382f] rounded-xl px-4 py-3 text-white placeholder-[#9cbaa6] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="governor@state.gov"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Secure Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#29382f] border border-[#29382f] rounded-xl px-4 py-3 text-white placeholder-[#9cbaa6] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {/* Wallet Connection */}
                <div className="border border-[#28392e] rounded-xl p-4 bg-[#141f18]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm font-medium">Wallet Authentication</span>
                    <span className="text-xs text-[#9cbaa6] bg-[#29382f] px-2 py-1 rounded">Required</span>
                  </div>
                  <Button
                    onClick={connectWallet}
                    className={`w-full border ${walletConnected ? 'bg-green-600 hover:bg-green-700 border-green-600' : 'bg-[#29382f] hover:bg-[#35463b] border-[#35463b] hover:border-primary/30'} text-white`}
                    loading={isConnecting}
                  >
                    <Icon name="account_balance_wallet" size="sm" className="mr-2" />
                    {walletConnected ? `Connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : isConnecting ? 'Connecting...' : 'Connect Governor Wallet'}
                  </Button>
                </div>

                {/* Login Button */}
                <Button
                  onClick={handleLogin}
                  className="w-full bg-primary hover:bg-[#2bc466] text-[#111714] font-bold py-3 shadow-[0_4px_14px_0_rgba(56,224,123,0.39)]"
                  disabled={!walletConnected}
                >
                  Access Governor Dashboard
                </Button>

                {/* Links */}
                <div className="flex flex-col gap-2 text-center text-sm">
                  <a href="#" className="text-[#9cbaa6] hover:text-primary transition-colors">
                    Forgot your password?
                  </a>
                  <div className="text-[#9cbaa6]">
                    Need governor access? {' '}
                    <a href="/register" className="text-primary hover:underline font-medium">
                      Request Registration
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-[#28392e] bg-[#102216] text-center">
        <p className="text-[#4d5c52] text-xs">
          © 2024 Optic-Gov Decentralized Protocol. All rights reserved.
        </p>
      </footer>
    </div>
  );
};