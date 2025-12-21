const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

class HealthService {
  async checkHealth(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Health check failed`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("HealthService.checkHealth error:", error);
      throw error;
    }
  }

  async getRoot(): Promise<{ message: string; docs: string; health: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Root endpoint failed`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("HealthService.getRoot error:", error);
      throw error;
    }
  }
}

export const healthService = new HealthService();
