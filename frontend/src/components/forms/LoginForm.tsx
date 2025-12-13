import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Web3Icon } from '@/components/ui/Web3Icon';
import { useLogin } from '@/hooks/useLogin';

export const LoginForm = () => {
  const { data, errors, isLoading, updateField, login, connectWallet } = useLogin();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login();
    if (success) {
      console.log('Login successful!');
    }
  };

  const handleWalletConnect = async () => {
    const success = await connectWallet();
    if (success) {
      console.log('Wallet connected!');
    }
  };

  return (
    <div className="max-w-[420px] w-full mx-auto">
      <motion.div 
        className="mb-8 text-center lg:text-left"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-white text-2xl font-bold mb-2">Sign in to your account</h3>
        <p className="text-[#9cbaa6] text-sm">Welcome back, Governor.</p>
      </motion.div>

      {errors.general && (
        <motion.div 
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {errors.general}
        </motion.div>
      )}

      {/* Connect Wallet Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleWalletConnect}
            loading={isLoading}
            className="w-full bg-primary hover:bg-[#00d64b] text-[#102216] h-14 mb-6 shadow-[0_0_15px_rgba(13,242,89,0.4)] hover:shadow-[0_0_25px_rgba(13,242,89,0.6)]"
            size="lg"
          >
            <motion.div
              animate={{ rotate: isLoading ? 360 : 0 }}
              transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: "linear" }}
            >
              <Web3Icon name="wallet" size="md" className="mr-3" />
            </motion.div>
            Connect Wallet
          </Button>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div 
        className="relative flex py-4 items-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex-grow border-t border-[#28392e]" />
        <span className="flex-shrink-0 mx-4 text-[#9cbaa6] text-xs uppercase font-medium">
          Or continue with email
        </span>
        <div className="flex-grow border-t border-[#28392e]" />
      </motion.div>

      {/* Email Login Form */}
      <motion.form 
        onSubmit={handleEmailLogin} 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Input
          id="email"
          label="Email Address"
          type="email"
          icon="mail"
          placeholder="governor@optic-gov.eth"
          value={data.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          className="bg-[#111813] border-[#28392e] focus:border-primary"
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-white text-sm font-medium">Password</label>
            <a 
              href="#" 
              className="text-xs text-primary hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            icon="lock"
            placeholder="••••••••"
            value={data.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={errors.password}
            className="bg-[#111813] border-[#28392e] focus:border-primary"
          />
        </div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Button
            type="submit"
            loading={isLoading}
            variant="secondary"
            className="w-full mt-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            size="lg"
          >
            <motion.span
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Log In
            </motion.span>
          </Button>
        </motion.div>
      </motion.form>

      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p className="text-[#9cbaa6] text-sm">
          New to Optic-Gov?{' '}
          <a 
            href="/register" 
            className="text-primary font-bold hover:underline transition-colors"
          >
            Create an account
          </a>
        </p>
      </motion.div>
    </div>
  );
};