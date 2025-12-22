const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export interface ContractorRegisterRequest {
  wallet_address: string;
  company_name: string;
  email: string;
  password: string;
}

export interface ContractorLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class ContractorService {
  async register(request: ContractorRegisterRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ContractorService.register error:', error);
      throw error;
    }
  }

  async login(request: ContractorLoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();

      // Store token in localStorage
      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
      }

      return result;
    } catch (error) {
      console.error('ContractorService.login error:', error);
      throw error;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  logout(): void {
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const contractorService = new ContractorService();
