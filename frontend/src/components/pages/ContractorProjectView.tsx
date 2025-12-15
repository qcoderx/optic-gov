import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const ContractorProjectView = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isProcessing] = useState(false);

  const handleVerifyMilestone = () => {
    setIsNavigating(true);
    setTimeout(() => {
      window.location.href = '/contractor/verify/1';
    }, 1500);
  };

  const handleBackToDashboard = () => {
    setIsNavigating(true);
    setTimeout(() => {
      window.location.href = '/contractor';
    }, 1500);
  };

  if (isNavigating) {
    return <LoadingScreen message="Loading verification interface..." />;
  }

  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#122017]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
        <motion.div 
          className="size-20 rounded-full border-4 border-[#29382f] border-t-[#38e07b]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <h3 className="text-xl font-bold text-white mb-2 mt-6">Analyzing Footage...</h3>
        <p className="text-[#9eb7a8] text-center max-w-xs">Gemini AI is verifying concrete density and surface integrity.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#122017] text-white antialiased min-h-screen flex flex-col font-display">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b border-[#29382f] bg-[#122017]/80 backdrop-blur-md px-6 py-4"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleBackToDashboard}
              className="size-8 text-[#38e07b] hover:scale-110 transition-transform"
              whileHover={{ scale: 1.1 }}
            >
              <Icon name="policy" className="text-3xl" />
            </motion.button>
            <h1 className="text-xl font-bold tracking-tight">Optic-Gov</h1>
          </div>
          <div className="flex items-center gap-4">
            <motion.div 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c2620] border border-[#29382f]"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span 
                className="w-2 h-2 rounded-full bg-[#38e07b]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-[#9eb7a8]">Mainnet Live</span>
            </motion.div>
            <motion.button 
              className="flex items-center gap-2 bg-[#1c2620] hover:bg-[#2a3830] transition-colors border border-[#29382f] rounded-full pl-2 pr-4 py-1.5"
              whileHover={{ scale: 1.05 }}
            >
              <div className="size-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
              <span className="text-sm font-medium">0x83...12F4</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-start pt-8 pb-12 px-4">
        {/* Mobile-first constrained container */}
        <div className="w-full max-w-[480px] flex flex-col gap-6">
          {/* Context Heading */}
          <motion.div 
            className="flex flex-col gap-1 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#9eb7a8] text-sm uppercase tracking-wider font-semibold">Active Contract</p>
            <h2 className="text-3xl font-black tracking-tight">Bridge Phase 1</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Icon name="location_on" className="text-[#9eb7a8] text-lg" />
              <p className="text-[#9eb7a8]">Austin, TX Infrastructure Zone B</p>
            </div>
          </motion.div>

          {/* Primary Status Card */}
          <motion.div 
            className="relative overflow-hidden rounded-xl bg-[#1c2620] border border-[#29382f] shadow-2xl shadow-black/40 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMzhlMDdiIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] mix-blend-overlay" />
            
            {/* Card Content */}
            <div className="relative p-8 flex flex-col items-center gap-6">
              {/* Icon Badge */}
              <motion.div 
                className="size-16 rounded-full bg-[#122017] border border-[#29382f] flex items-center justify-center shadow-inner"
                animate={{ 
                  boxShadow: ['0 0 0 rgba(56,224,123,0)', '0 0 20px rgba(56,224,123,0.3)', '0 0 0 rgba(56,224,123,0)']
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Icon name="lock" className="text-[#38e07b] text-3xl" />
              </motion.div>
              
              <div className="text-center">
                <p className="text-[#9eb7a8] text-sm font-medium mb-1">Funds Locked in Smart Contract</p>
                <div className="flex items-baseline justify-center gap-1">
                  <motion.span 
                    className="text-5xl font-black tracking-tight text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    5.0
                  </motion.span>
                  <span className="text-2xl font-bold text-[#38e07b]">ETH</span>
                </div>
                <p className="text-xs text-[#9eb7a8] mt-2 opacity-60">≈ $12,450.00 USD</p>
              </div>
              
              {/* Milestone Progress Bar */}
              <div className="w-full mt-2">
                <div className="flex justify-between text-xs text-[#9eb7a8] mb-2">
                  <span>Milestone Progress</span>
                  <span>80%</span>
                </div>
                <div className="h-2 w-full bg-[#122017] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#38e07b] rounded-full shadow-[0_0_10px_rgba(56,224,123,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                  />
                </div>
              </div>
            </div>
            
            {/* Bottom Meta Info */}
            <div className="bg-[#161e19] px-6 py-3 border-t border-[#29382f] flex justify-between items-center text-xs text-[#9eb7a8]">
              <span>Contract #0x83...99a</span>
              <motion.a 
                className="hover:text-white transition-colors flex items-center gap-1"
                href="#"
                whileHover={{ x: 5 }}
              >
                View on Etherscan
                <Icon name="open_in_new" size="sm" />
              </motion.a>
            </div>
          </motion.div>

          {/* Action Area */}
          <motion.div 
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Verify Button */}
            <motion.button 
              className="relative group w-full overflow-hidden rounded-full bg-[#38e07b] hover:bg-[#32c96e] transition-all duration-300 h-14 flex items-center justify-center shadow-[0_0_20px_rgba(56,224,123,0.3)]"
              onClick={handleVerifyMilestone}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              />
              <div className="relative flex items-center gap-3 text-[#122017] font-bold text-lg">
                <Icon name="videocam" />
                <span>Verify Milestone via AI Oracle</span>
              </div>
            </motion.button>
            
            {/* Helper Text */}
            <div className="flex items-start gap-2 px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Icon name="info" className="text-blue-400 shrink-0 text-lg mt-0.5" />
              <p className="text-xs text-blue-200 leading-relaxed">
                Verification requires a 10s video scan of the site. Gemini 2.5 Flash will analyze the footage for concrete curing status.
              </p>
            </div>
          </motion.div>

          {/* Recent Activity / Timeline (Secondary) */}
          <motion.div 
            className="mt-4 pt-6 border-t border-[#29382f]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-sm font-semibold text-white mb-4 px-2">Timeline</h3>
            <div className="relative pl-4 border-l border-[#29382f] space-y-6 ml-2">
              {/* Step 1: Completed */}
              <div className="relative pl-6">
                <motion.div 
                  className="absolute -left-[21px] top-1 size-3 rounded-full bg-[#38e07b] shadow-[0_0_8px_rgba(56,224,123,0.6)]"
                  animate={{ 
                    boxShadow: ['0 0 8px rgba(56,224,123,0.6)', '0 0 15px rgba(56,224,123,0.8)', '0 0 8px rgba(56,224,123,0.6)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-white text-sm font-medium">Foundation Poured</p>
                  <p className="text-xs text-[#9eb7a8]">Verified · 2 days ago</p>
                </div>
              </div>
              
              {/* Step 2: Current */}
              <div className="relative pl-6">
                <motion.div 
                  className="absolute -left-[23px] top-0 size-4 rounded-full border-2 border-[#38e07b] bg-[#122017]"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-white text-sm font-medium">Curing Verification</p>
                  <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-[#38e07b]/20 text-[#38e07b] uppercase tracking-wide">
                    Pending Action
                  </span>
                </div>
              </div>
              
              {/* Step 3: Upcoming */}
              <div className="relative pl-6 opacity-50">
                <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-[#29382f]" />
                <div className="flex flex-col gap-1">
                  <p className="text-white text-sm font-medium">Safety Inspection</p>
                  <p className="text-xs text-[#9eb7a8]">Upcoming</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#9eb7a8] border-t border-[#29382f] bg-[#122017]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>Powered by</span>
          <span className="font-bold text-white">Ethereum</span>
          <span>&</span>
          <span className="font-bold text-white">Google Gemini</span>
        </div>
        <p>© 2024 Optic-Gov Protocol. All rights reserved.</p>
      </footer>
    </div>
  );
};