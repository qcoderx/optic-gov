export interface Project {
  id: string | number;
  title: string;
  name?: string;
  description?: string;
  location?: string;
  status: 'pending' | 'in-progress' | 'completed';
  budget: number;
  total_budget_mnt?: number;
  total_budget_ngn?: number;
  budget_currency?: 'NGN' | 'MNT';
  progress?: number;
  aiConfidence?: number;
  votes?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  project_latitude?: number;
  project_longitude?: number;
  contractor_id?: number;
  ai_generated?: boolean;
  gov_wallet?: string;
  on_chain_id?: string; // Mantle blockchain project ID
  contractor_wallet?: string; // Ethereum address for contractor payouts
  created_at?: string;
  exchange_rate?: number;
  // ADD THIS FIELD
  milestones?: {
    id: number;
    description: string;
    amount: number;
    status: string;
    criteria?: string; // For AI verification
  }[];
  evidence?: {
    videoUrl?: string;
    imageUrl?: string;
    aiAnalysis?: string;
    transactionHash?: string;
    fundsReleased?: number;
  };
}

export interface ProjectsResponse {
  projects: Project[];
  exchange_rate: number;
}

export interface ProjectCreateRequest {
  name: string;
  description: string;
  total_budget: number;
  budget_currency: 'NGN' | 'MNT';
  contractor_wallet: string; // MUST be valid Ethereum address
  use_ai_milestones: boolean;
  manual_milestones?: string[];
  project_latitude: number;
  project_longitude: number;
  location_tolerance_km?: number;
  gov_wallet: string;
  on_chain_id: string; // Mantle blockchain project ID
}

export interface MapState {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  selectedProject?: Project;
}

export interface ProjectFilters {
  status?: 'all' | 'pending' | 'in-progress' | 'completed';
  search?: string;
}