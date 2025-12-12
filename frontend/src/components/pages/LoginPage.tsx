import { motion } from 'framer-motion';
import { LoginForm } from '@/components/forms/LoginForm';
import { Icon } from '@/components/ui/Icon';
import { TypewriterText } from '@/components/ui/TypewriterText';

export const LoginPage = () => {
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
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_330)">
                  <path 
                    clipRule="evenodd" 
                    d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" 
                    fill="currentColor" 
                    fillRule="evenodd"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_6_330">
                    <rect fill="white" height="48" width="48" />
                  </clipPath>
                </defs>
              </svg>
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
            href="/dashboard" 
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
                  Secure Infrastructure Verification
                </motion.span>
              </motion.div>
              
              <h2 className="text-white text-4xl lg:text-5xl font-black leading-tight tracking-[-0.033em] mb-4">
                <TypewriterText text="Building Trust" speed={100} />
                <br />
                <span className="text-[#9cbaa6]">
                  <TypewriterText text="Block by Block" delay={1500} speed={120} />
                </span>
              </h2>
              
              <p className="text-[#9cbaa6] text-lg font-normal leading-relaxed max-w-sm">
                <TypewriterText 
                  text="Prevent corruption in public projects with immutable audit trails powered by Ethereum Smart Contracts."
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
                alt="Abstract digital blockchain network nodes glowing green"
                className="object-cover w-full h-full opacity-60 mix-blend-overlay"
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop&q=80"
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
                  <Icon name="verified_user" size="sm" />
                </motion.div>
                Secured by Gemini AI & Ethereum
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-14 flex flex-col justify-center bg-[#1b271f]">
            <LoginForm />
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