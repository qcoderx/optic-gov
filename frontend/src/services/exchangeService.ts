const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export interface ExchangeRateResponse {
  mnt_to_ngn: number;
  ngn_to_mnt: number;
  timestamp: string;
  cached: boolean;
}

export interface MntRateResponse {
  mnt_to_ngn_rate: number;
  timestamp: string;
  cache_age_seconds: number;
}

export interface EthRateResponse {
  eth_to_ngn_rate: number;
  timestamp: string;
  cache_age_seconds: number;
}

export interface ConvertNgnToMntResponse {
  naira_amount: number;
  mnt_amount: number;
  exchange_rate: number;
  formatted_mnt: string;
  formatted_naira: string;
}

class ExchangeService {
  async getExchangeRate(): Promise<ExchangeRateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/exchange-rate`);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ExchangeService.getExchangeRate error:", error);
      throw error;
    }
  }

  async getMntRate(): Promise<MntRateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/mnt-rate`);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ExchangeService.getMntRate error:", error);
      throw error;
    }
  }

  async getEthRate(): Promise<EthRateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/eth-rate`);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ExchangeService.getEthRate error:", error);
      throw error;
    }
  }

  async convertNgnToMnt(nairaAmount: number): Promise<ConvertNgnToMntResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/convert/ngn-to-mnt/${nairaAmount}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ExchangeService.convertNgnToMnt error:", error);
      throw error;
    }
  }
}

export const exchangeService = new ExchangeService();
