export interface Project {
  id: string;
  title: string;
  location: string;
  status: 'pending' | 'in-progress' | 'completed';
  budget: number;
  progress?: number;
  aiConfidence?: number;
  votes?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  evidence?: {
    videoUrl?: string;
    imageUrl?: string;
    aiAnalysis?: string;
    transactionHash?: string;
    fundsReleased?: number;
  };
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