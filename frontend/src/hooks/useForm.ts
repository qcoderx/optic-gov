import { useState } from 'react';
import type { RegistrationData, FormErrors } from '@/types/auth';

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const useForm = () => {
  const [data, setData] = useState<RegistrationData>({
    role: 'Governor',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof RegistrationData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!data.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(data.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!data.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return false;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
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
    submit
  };
};