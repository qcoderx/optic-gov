const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

import type {
  Project,
  ProjectsResponse,
  ProjectCreateRequest,
} from "@/types/project";

class ProjectService {
  async getAllProjects(): Promise<ProjectsResponse> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
  }

  async getProject(projectId: number): Promise<Project> {
    if (!projectId || isNaN(projectId) || projectId <= 0) {
      throw new Error(`Invalid project ID: ${projectId}`);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch project (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      return this.transformProject(data);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  async createProject(project: ProjectCreateRequest): Promise<any> {
    // Ensure budget_currency is properly set
    const projectData = {
      ...project,
      budget_currency: project.budget_currency || "NGN",
    };

    const response = await fetch(`${API_BASE_URL}/create-project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create project: ${errorData}`);
    }
    return response.json();
  }

  async updateProject(
    projectId: number,
    updates: Partial<Project>
  ): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update project");
    return response.json();
  }

  async deleteProject(projectId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete project");
  }

  // Transform backend project to frontend format
  transformProject(backendProject: any): Project {
    return {
      id: backendProject.id,
      title: backendProject.name || `Project #${backendProject.id}`,
      name: backendProject.name,
      description: backendProject.description,
      location: `Lat: ${backendProject.project_latitude?.toFixed(
        4
      )}, Lng: ${backendProject.project_longitude?.toFixed(4)}`,
      status: "pending", // Default status, can be enhanced based on milestones
      budget: backendProject.total_budget_eth || 0,
      total_budget_eth: backendProject.total_budget_eth,
      total_budget_ngn: backendProject.total_budget_ngn,
      budget_currency: "NGN", // Default to NGN for Nigerian government
      coordinates:
        backendProject.project_latitude && backendProject.project_longitude
          ? {
              lat: backendProject.project_latitude,
              lng: backendProject.project_longitude,
            }
          : undefined,
      project_latitude: backendProject.project_latitude,
      project_longitude: backendProject.project_longitude,
      contractor_id: backendProject.contractor_id,
      ai_generated: backendProject.ai_generated,
      gov_wallet: backendProject.gov_wallet,
      on_chain_id: backendProject.on_chain_id,
      created_at: backendProject.created_at,
      exchange_rate: backendProject.exchange_rate,
    };
  }
}

export const projectService = new ProjectService();
