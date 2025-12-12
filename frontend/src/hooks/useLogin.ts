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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    } catch (error) {
      setErrors({ general: 'Invalid email or password' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      setErrors({ general: 'Failed to connect wallet' });
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