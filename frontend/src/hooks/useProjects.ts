import { useState, useEffect, useMemo } from 'react';
import type { Project, ProjectFilters } from '@/types/project';
import { projectService } from '@/services/projectService';

export const useProjects = () => {
  const [filters, setFilters] = useState<ProjectFilters>({ status: 'all' });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Fetch projects from backend
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getAllProjects();
      const transformedProjects = response.projects.map(p => projectService.transformProject(p));
      setProjects(transformedProjects);
      setExchangeRate(response.exchange_rate);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to connect to backend server. Please check your connection.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (filters.status && filters.status !== 'all' && project.status !== filters.status) {
        return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return project.title.toLowerCase().includes(search) ||
               project.id.toString().toLowerCase().includes(search) ||
               (project.location && project.location.toLowerCase().includes(search));
      }
      return true;
    });
  }, [projects, filters]);

  const updateFilters = (newFilters: Partial<ProjectFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    projects: filteredProjects,
    allProjects: projects,
    filters,
    selectedProject,
    loading,
    error,
    exchangeRate,
    updateFilters,
    setSelectedProject,
    refetch: fetchProjects
  };
};