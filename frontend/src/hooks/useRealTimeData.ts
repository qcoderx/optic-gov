import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services/projectService';
import { suiService } from '@/services/suiService';

export function useRealTimeProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch from backend
      const backendData = await projectService.getAllProjects();
      
      // Fetch from SUI blockchain
      try {
        const suiProjects = await suiService.getProjects();
        
        // Merge backend and blockchain data
        const mergedProjects = backendData.projects.map(backendProject => {
          const suiProject = suiProjects.find(sp => sp.id === backendProject.id);
          return {
            ...backendProject,
            blockchain_data: suiProject,
            is_synced: !!suiProject
          };
        });
        
        setProjects(mergedProjects);
      } catch (suiError) {
        console.warn('SUI fetch failed, using backend only:', suiError);
        setProjects(backendData.projects.map(p => ({ ...p, is_synced: false })));
      }
      
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError('Failed to load projects. Please check connection.');
      setProjects([]); // NO MOCK DATA
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    
    // Set up real-time polling
    const interval = setInterval(fetchProjects, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}

export function useRealTimeMilestones(projectId: string) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setError(null);
      
      // Fetch milestones from SUI blockchain
      const suiMilestones = await suiService.getProjectMilestones(projectId);
      setMilestones(suiMilestones);
      
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch milestones');
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMilestones();
    
    // Set up real-time polling for milestones
    const interval = setInterval(fetchMilestones, 15000); // Poll every 15 seconds
    
    return () => clearInterval(interval);
  }, [fetchMilestones]);

  return { milestones, loading, error, refetch: fetchMilestones };
}