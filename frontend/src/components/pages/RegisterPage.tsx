import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { RegistrationForm } from '@/components/forms/RegistrationForm';
import { Icon } from '@/components/ui/Icon';
import { TypewriterText } from '@/components/ui/TypewriterText';

export const RegisterPage = () => {
  return (
    <div className="bg-[#102216] font-display text-white min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center relative p-4 py-12 md:py-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="w-full max-w-[520px] relative z-10 flex flex-col gap-6">
          {/* Header Section */}
          <motion.div 
            className="text-center mb-4 space-y-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2 border border-primary/20 shadow-[0_0_20px_rgba(19,236,91,0.1)]"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon name="verified_user" className="text-primary text-3xl" />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              <TypewriterText text="Join Optic-Gov" speed={100} />
            </h1>
            
            <p className="text-text-secondary text-sm md:text-base max-w-sm mx-auto leading-relaxed">
              <TypewriterText 
                text="Transparency starts here. Create your secure account to manage infrastructure projects on the blockchain."
                delay={1500}
                speed={30}
              />
            </p>
          </motion.div>

          <RegistrationForm />

          {/* Trust Badge */}
          <motion.div 
            className="flex justify-center items-center gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 2, duration: 0.5 }}
            whileHover={{ opacity: 1 }}
          >
            <Icon name="lock" className="text-text-secondary text-sm" />
            <span className="text-xs text-text-secondary font-medium tracking-wide">
              SECURED WITH ETHEREUM
            </span>
          </motion.div>
        </div>
      </main>
    </div>
  );
};