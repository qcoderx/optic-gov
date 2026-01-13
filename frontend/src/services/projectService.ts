const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

import type {
  Project,
  ProjectsResponse,
  ProjectCreateRequest,
} from "@/types/project";

class ProjectService {
  async getAllProjects(): Promise<ProjectsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: Failed to fetch projects`);
      const data = await response.json();
      return {
        projects: data.projects || data || [],
        exchange_rate: data.exchange_rate || 1600,
      };
    } catch (error) {
      console.error("ProjectService.getAllProjects error:", error);
      throw new Error(
        "Unable to connect to backend. Please check if the server is running."
      );
    }
  }

  async getProject(projectId: number): Promise<Project> {
    if (!projectId || isNaN(projectId) || projectId <= 0) {
      throw new Error(`Invalid project ID: ${projectId}`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch project (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      return this.transformProject(data);
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Unable to connect to server. Please check your internet connection."
        );
      }
      throw error;
    }
  }

  async createProject(project: ProjectCreateRequest): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/create-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Backend error:", errorBody);
        throw new Error(
          `Failed to create project in backend: ${errorBody}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("ProjectService.createProject error:", error);
      throw error; // Re-throw to be caught in the component
    }
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

  async createManualMilestone(milestone: {
    project_id: number;
    description: string;
    amount: number;
    order_index: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/milestones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(milestone),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ProjectService.createManualMilestone error:", error);
      throw error;
    }
  }

  async getMilestone(milestoneId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/milestones/${milestoneId}`);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ProjectService.getMilestone error:", error);
      throw error;
    }
  }

  async getProjectByMilestone(milestoneId: number): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/milestones/${milestoneId}/project`
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ProjectService.getProjectByMilestone error:", error);
      throw error;
    }
  }

  // Transform backend project to frontend format
  private transformProject(data: any): Project {
    return {
      ...data, // This preserves all raw fields like 'budget' and 'total_budget_ngn'
      id: data.id,
      name: data.name || data.title,
      description: data.description,
      // Add these explicitly just in case
      total_budget_mnt: data.budget || data.total_budget_mnt,
      total_budget_ngn: data.total_budget_ngn,
      milestones: data.milestones || []
    };
  }
}

export const projectService = new ProjectService();
