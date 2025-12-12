export interface WalletState {
  isConnected: boolean;
  address?: string;
  isConnecting: boolean;
  error?: string;
}

export interface VerificationResult {
  id: string;
  target: string;
  matchPercentage: number;
  status: 'pending' | 'verified' | 'failed';
  txHash?: string;
  ethReleased?: number;
  timestamp: Date;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: string;
  status: 'active' | 'completed' | 'pending';
}