import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Web3Icon } from '@/components/ui/Web3Icon';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TypewriterText } from '@/components/ui/TypewriterText';

const mockVerificationData = {
  target: 'Bridge Foundation - Sector 4',
  matchPercentage: 92,
  txHash: '0x71C...92F',
  ethReleased: 15.4,
  imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop&q=80',
  backgroundUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80',
};

export const HeroSection = () => {
  return (
    <section className="w-full flex justify-center px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-800 rounded-full blur-[120px]" />
      </div>

      <div className="layout-content-container z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div 
            className="flex flex-col gap-6 max-w-[640px]"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <StatusBadge variant="live">
              Now Live on Sepolia Testnet
            </StatusBadge>

            <h1 className="text-white text-5xl md:text-6xl font-black leading-tight tracking-tight">
              <TypewriterText text="Eliminate Corruption." speed={80} /> <br />
              <span className="text-gradient">
                <TypewriterText text="Build Trust." delay={1500} speed={100} />
              </span>
            </h1>

            <p className="text-text-secondary text-lg md:text-xl font-normal leading-relaxed max-w-[540px]">
              <TypewriterText 
                text="The first dApp to use Gemini 2.5 Flash as an AI Oracle for visual verification. We replace opaque ledgers with immutable code and computer vision."
                delay={3000}
                speed={40}
              />
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <Button 
                size="lg" 
                className="min-w-[140px]"
                onClick={() => window.open('/register', '_self')}
              >
                Launch App
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                className="min-w-[140px] group"
              >
                <span className="mr-2">View Demo</span>
                <Icon 
                  name="arrow_forward" 
                  size="sm" 
                  className="group-hover:translate-x-1 transition-transform" 
                />
              </Button>
            </div>

            <div className="flex items-center gap-4 mt-6 text-sm text-text-secondary">
              <span className="flex items-center gap-1 animate-pulse">
                <Icon name="check_circle" size="sm" className="text-green-500" />
                Audited Contracts
              </span>
              <span className="flex items-center gap-1">
                <Web3Icon name="oracle" size="sm" className="text-primary animate-spin" />
                Powered by Gemini
              </span>
            </div>
          </motion.div>

          {/* Demo Interface */}
          <motion.div 
            className="relative w-full h-[350px] md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden border border-border-dark bg-card-dark shadow-2xl group"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${mockVerificationData.backgroundUrl})` }}
            >
              <div className="absolute inset-0 bg-background-dark/60 backdrop-blur-[2px]" />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[400px] bg-background-dark/90 backdrop-blur-xl border border-primary/30 rounded-xl p-5 shadow-2xl">
              {/* Status Header */}
              <div className="flex items-center justify-between mb-4 border-b border-border-dark pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-mono text-text-secondary">
                    ORACLE_STATUS: ONLINE
                  </span>
                </div>
                <span className="text-xs font-bold text-primary">
                  GEMINI-2.5-FLASH
                </span>
              </div>

              {/* Analysis Content */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div 
                    className="w-16 h-16 rounded bg-gray-700 bg-cover bg-center shrink-0 border border-gray-600"
                    style={{ backgroundImage: `url(${mockVerificationData.imageUrl})` }}
                  />
                  <div className="flex flex-col justify-center gap-1">
                    <div className="text-xs text-gray-400">Analysis Target</div>
                    <div className="text-sm font-bold text-white">
                      {mockVerificationData.target}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1 w-24 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-1000"
                          style={{ width: `${mockVerificationData.matchPercentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-green-400">
                        {mockVerificationData.matchPercentage}% Match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Result */}
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon name="verified" className="text-green-500 mt-0.5" size="sm" />
                    <div>
                      <p className="text-xs font-bold text-green-400 mb-0.5">
                        Verification Successful
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        TxHash: {mockVerificationData.txHash} • {mockVerificationData.ethReleased} ETH Released
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};