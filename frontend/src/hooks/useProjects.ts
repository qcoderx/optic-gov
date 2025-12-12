import { useState, useMemo } from 'react';
import type { Project, ProjectFilters } from '@/types/project';

const mockProjects: Project[] = [
  {
    id: 'NY-2024-882',
    title: 'Downtown Bridge Repair',
    location: 'Manhattan',
    status: 'completed',
    budget: 500,
    aiConfidence: 98.5,
    coordinates: { lat: 40.7589, lng: -73.9851 },
    evidence: {
      imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop',
      aiAnalysis: 'Visual confirmation of structural integrity. Rebar density matches schematic V.2.',
      transactionHash: '0x71C...9A23',
      fundsReleased: 50
    }
  },
  {
    id: 'NY-2024-421',
    title: 'East Side Highway',
    location: 'Queens',
    status: 'in-progress',
    budget: 1200,
    progress: 45,
    coordinates: { lat: 40.7282, lng: -73.7949 }
  },
  {
    id: 'NY-2024-990',
    title: 'Central Station Upgrade',
    location: 'Midtown',
    status: 'pending',
    budget: 3500,
    votes: 82,
    coordinates: { lat: 40.7505, lng: -73.9934 }
  },
  {
    id: 'NY-2023-112',
    title: 'Metro Tunnel B',
    location: 'Brooklyn',
    status: 'completed',
    budget: 800,
    aiConfidence: 99.1,
    coordinates: { lat: 40.6892, lng: -73.9442 }
  },
  {
    id: 'NY-2024-445',
    title: 'Bronx Water Treatment',
    location: 'Bronx',
    status: 'in-progress',
    budget: 2200,
    progress: 67,
    coordinates: { lat: 40.8448, lng: -73.8648 }
  },
  {
    id: 'NY-2024-556',
    title: 'Staten Island Ferry Dock',
    location: 'Staten Island',
    status: 'pending',
    budget: 1800,
    votes: 156,
    coordinates: { lat: 40.6438, lng: -74.0740 }
  },
  {
    id: 'NY-2024-667',
    title: 'FDR Drive Resurfacing',
    location: 'Manhattan',
    status: 'completed',
    budget: 950,
    aiConfidence: 94.2,
    coordinates: { lat: 40.7505, lng: -73.9734 }
  },
  {
    id: 'NY-2024-778',
    title: 'Queens Boulevard Lighting',
    location: 'Queens',
    status: 'in-progress',
    budget: 650,
    progress: 23,
    coordinates: { lat: 40.7282, lng: -73.8049 }
  },
  {
    id: 'NY-2024-889',
    title: 'Brooklyn Heights Promenade',
    location: 'Brooklyn',
    status: 'pending',
    budget: 1400,
    votes: 203,
    coordinates: { lat: 40.6962, lng: -73.9942 }
  },
  {
    id: 'NY-2024-101',
    title: 'Harlem River Walkway',
    location: 'Manhattan',
    status: 'completed',
    budget: 750,
    aiConfidence: 96.8,
    coordinates: { lat: 40.8176, lng: -73.9482 }
  }
];

export const useProjects = () => {
  const [filters, setFilters] = useState<ProjectFilters>({ status: 'all' });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    return mockProjects.filter(project => {
      if (filters.status && filters.status !== 'all' && project.status !== filters.status) {
        return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return project.title.toLowerCase().includes(search) ||
               project.id.toLowerCase().includes(search) ||
               project.location.toLowerCase().includes(search);
      }
      return true;
    });
  }, [filters]);

  const updateFilters = (newFilters: Partial<ProjectFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    projects: filteredProjects,
    allProjects: mockProjects,
    filters,
    selectedProject,
    updateFilters,
    setSelectedProject
  };
};