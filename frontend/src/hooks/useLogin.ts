import { useState } from 'react';
import type { LoginData, LoginErrors } from '@/types/auth';

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const useLogin = () => {
  const [data, setData] = useState<LoginData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof LoginData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async () => {
    if (!validate()) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch('https://optic-gov.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
      
      const result = await response.json();
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('contractor_id', result.contractor_id);
      localStorage.setItem('wallet_address', result.wallet_address);
      
      window.location.href = '/contractor';
      return true;
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Invalid email or password' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const { useSuiWallet } = await import('@/hooks/useSuiWallet');
      const { address } = useSuiWallet();
      
      if (!address) {
        throw new Error('Please connect your wallet first');
      }
      
      localStorage.setItem('wallet_address', address);
      window.location.href = '/contractor';
      return true;
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to connect wallet' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    errors,
    isLoading,
    updateField,
    login,
    connectWallet
  };
};