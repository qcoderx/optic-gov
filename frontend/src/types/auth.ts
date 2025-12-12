export interface RegistrationData {
  role: 'Governor' | 'Contractor';
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface AuthState {
  isLoading: boolean;
  error?: string;
  isAuthenticated: boolean;
}