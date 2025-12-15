import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export const MilestoneVerificationPage = () => {
  const { milestoneId } = useParams();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyMilestone = () => {
    setIsVerifying(true);
    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false);
      // Navigate to actual milestone submission
      window.location.href = `/contractor/milestone/${milestoneId}`;
    }, 2000);
  };

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen flex flex-col font-display">
      {/* Header */}
      <motion.header 
        className="flex items-center justify-between border-b border-[#283928] bg-[#111811] px-6 py-4"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className="size-8 text-[#0df20d] flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Icon name="token" className="text-3xl" />
          </motion.div>
          <h1 className="text-white text-xl font-bold">Optic-Gov</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#283928]/30 border border-[#283928] text-xs font-mono text-gray-400">
            <div className="w-2 h-2 rounded-full bg-[#0df20d]" />
            Mainnet Live
          </div>
          <button className="bg-[#283928] border border-[#0df20d]/20 hover:border-[#0df20d]/50 transition-colors text-white text-sm font-bold px-4 py-2 rounded">
            0x83...12F4
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Active Contract Badge */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-[#0df20d]/10 border border-[#0df20d]/30 text-[#0df20d] px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-4">
              Active Contract
            </div>
          </motion.div>

          {/* Project Title */}
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold text-white">Bridge Phase 1</h2>
            <p className="text-gray-400">Austin, TX Infrastructure Zone B</p>
          </motion.div>

          {/* Funds Card */}
          <motion.div 
            className="bg-[#111811] border border-[#283928] rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">Funds Locked in Smart Contract</p>
            <div className="space-y-2">
              <div className="text-6xl font-bold text-white">5.0</div>
              <div className="text-[#0df20d] text-xl font-bold">ETH</div>
              <div className="text-gray-400">≈ $12,450.00 USD</div>
            </div>
          </motion.div>

          {/* Milestone Progress */}
          <motion.div 
            className="bg-[#111811] border border-[#283928] rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Milestone Progress</h3>
              <span className="text-[#0df20d] text-2xl font-bold">80%</span>
            </div>
            <div className="w-full bg-[#1c291c] rounded-full h-3 mb-4">
              <motion.div 
                className="bg-[#0df20d] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Contract #0x83...99a</span>
              <a href="#" className="text-[#0df20d] hover:underline">View on Etherscan</a>
            </div>
          </motion.div>

          {/* Verify Button */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              className={`w-full h-16 text-lg font-bold uppercase tracking-wider rounded-xl transition-all ${
                isVerifying 
                  ? 'bg-[#1c291c] border border-[#283928] text-gray-500 cursor-not-allowed'
                  : 'bg-[#0df20d] hover:bg-[#0be00b] text-[#0a0a0a] shadow-[0_0_15px_rgba(13,242,13,0.4)]'
              }`}
              onClick={handleVerifyMilestone}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon name="refresh" />
                  </motion.div>
                  Initializing Verification...
                </div>
              ) : (
                'Verify Milestone via AI Oracle'
              )}
            </Button>
            <p className="text-gray-400 text-sm mt-4 max-w-md mx-auto">
              Verification requires a 10s video scan of the site. Gemini 2.5 Flash will analyze the footage for concrete curing status.
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div 
            className="bg-[#111811] border border-[#283928] rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-bold mb-6">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-[#0df20d]" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Foundation Poured</span>
                    <span className="text-sm text-[#0df20d]">Verified · 2 days ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Curing Verification</span>
                    <span className="text-sm text-yellow-400">Pending Action</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-400">Safety Inspection</span>
                    <span className="text-sm text-gray-400">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#283928] py-6 bg-[#111811]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-gray-400">Powered by</span>
            <div className="flex items-center gap-2">
              <Icon name="currency_bitcoin" className="text-[#0df20d]" />
              <span className="font-bold">Ethereum</span>
            </div>
            <span className="text-gray-400">&</span>
            <div className="flex items-center gap-2">
              <Icon name="smart_toy" className="text-[#0df20d]" />
              <span className="font-bold">Google Gemini</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Optic-Gov Protocol. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};