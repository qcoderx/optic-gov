import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services/projectService';
import { mantleService } from '@/services/mantleService';

export function useRealTimeProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch from backend
      const backendData = await projectService.getAllProjects();
      
      // Fetch from Mantle blockchain
      try {
        const mantleProjects = await Promise.all(
          backendData.projects
            .filter(p => p.on_chain_id)
            .map(async (p) => {
              try {
                const state = await mantleService.getProjectState(Number(p.on_chain_id));
                return { id: p.id, state };
              } catch {
                return null;
              }
            })
        );
        
        // Merge backend and blockchain data
        const mergedProjects = backendData.projects.map(backendProject => {
          const mantleProject = mantleProjects.find(mp => mp?.id === backendProject.id);
          return {
            ...backendProject,
            blockchain_data: mantleProject?.state,
            is_synced: !!mantleProject
          };
        });
        
        setProjects(mergedProjects);
      } catch (mantleError) {
        console.warn('Mantle fetch failed, using backend only:', mantleError);
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
      
      // Fetch milestones from backend (Mantle data is stored in backend)
      const response = await fetch(`https://optic-gov.onrender.com/projects/${projectId}/milestones`);
      if (!response.ok) throw new Error('Failed to fetch milestones');
      
      const data = await response.json();
      setMilestones(data.milestones || []);
      
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