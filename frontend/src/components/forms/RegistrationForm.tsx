import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icon } from '@/components/ui/Icon';
import { useForm } from '@/hooks/useForm';
import { usePasswordToggle } from '@/hooks/usePasswordToggle';

const roleOptions = [
  { value: 'Governor', label: 'Governor', icon: 'account_balance' },
  { value: 'Contractor', label: 'Contractor', icon: 'engineering' }
];

export const RegistrationForm = () => {
  const { data, errors, isLoading, updateField } = useForm();
  const passwordToggle = usePasswordToggle();
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnectedWallet(accounts[0]);
          // Auto-fill wallet address if not already filled
          if (!data.walletAddress) {
            updateField('walletAddress', accounts[0]);
          }
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
      }
    }
  };

  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedWallet(accounts[0]);
          updateField('walletAddress', accounts[0]);
        } else {
          setConnectedWallet(null);
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://optic-gov.onrender.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          wallet_address: data.walletAddress,
          company_name: data.fullName
        })
      });
      
      if (response.ok) {
        console.log('Registration successful!');
        // Redirect to appropriate dashboard
        window.location.href = data.role === 'Governor' ? '/governor' : '/contractor';
      } else {
        const error = await response.json();
        console.error('Registration failed:', error.detail);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <motion.div
      className="bg-[#1c271f] border border-[#28392e] rounded-xl p-6 md:p-8 shadow-2xl shadow-black/40 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <RadioGroup
          label="I am registering as a"
          options={roleOptions}
          value={data.role}
          onChange={(value) => updateField('role', value)}
          name="role"
        />

        <Input
          id="fullName"
          label="Full Legal Name"
          icon="person"
          placeholder="Enter your full name"
          value={data.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          error={errors.fullName}
        />

        <Input
          id="email"
          label="Email Address"
          type="email"
          icon="mail"
          placeholder="name@organization.gov"
          value={data.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
        />

        <Input
          id="walletAddress"
          label={`Sui Wallet Address ${connectedWallet ? '(Auto-filled from connected wallet)' : ''}`}
          icon="account_balance_wallet"
          placeholder={connectedWallet ? connectedWallet : "0x..."}
          value={data.walletAddress}
          onChange={(e) => updateField('walletAddress', e.target.value)}
          error={errors.walletAddress}
          className={connectedWallet ? 'border-green-500' : ''}
          rightElement={connectedWallet ? (
            <div className="text-green-500 text-xs font-medium">
              <Icon name="check_circle" size="sm" />
            </div>
          ) : null}
        />

        <Input
          id="password"
          label="Password"
          type={passwordToggle.type}
          icon="lock"
          placeholder="Create a secure password"
          value={data.password}
          onChange={(e) => updateField('password', e.target.value)}
          error={errors.password}
          rightElement={
            <button
              type="button"
              onClick={passwordToggle.toggle}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <Icon name={passwordToggle.icon} size="sm" />
            </button>
          }
        />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          icon="lock_reset"
          placeholder="Re-enter password"
          value={data.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
        />

        <Checkbox
          id="terms"
          checked={data.acceptTerms}
          onChange={(e) => updateField('acceptTerms', e.target.checked)}
          error={errors.acceptTerms}
          label={
            <>
              I agree to the{' '}
              <a href="#" className="font-medium text-white hover:text-primary underline decoration-primary/30 underline-offset-4 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-white hover:text-primary underline decoration-primary/30 underline-offset-4 transition-colors">
                Privacy Policy
              </a>.
            </>
          }
        />

        <Button
          type="submit"
          loading={isLoading}
          className="w-full mt-2 bg-primary hover:bg-[#0fc24a] text-[#111813] shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:shadow-[0_0_30px_rgba(19,236,91,0.5)]"
          size="lg"
        >
          <Icon name="rocket_launch" size="sm" className="mr-2" />
          Sign Up
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#28392e] text-center">
        <p className="text-sm text-text-secondary">
          Already have an account?{' '}
          <a 
            href={data.role === 'Governor' ? '/governor/login' : data.role === 'Contractor' ? '/contractor' : '/login'} 
            className="font-bold text-white hover:text-primary transition-colors"
          >
            Log In
          </a>
        </p>
      </div>
    </motion.div>
  );
};
