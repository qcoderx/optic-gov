const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export interface ExchangeRateResponse {
  sui_to_ngn: number;
  ngn_to_sui: number;
  timestamp: string;
  cached: boolean;
}

export interface SuiRateResponse {
  sui_to_ngn_rate: number;
  timestamp: string;
  cache_age_seconds: number;
}

export interface EthRateResponse {
  sui_to_ngn_rate: number;
  timestamp: string;
  cache_age_seconds: number;
}

export interface ConvertNgnToSuiResponse {
  naira_amount: number;
  sui_amount: number;
  exchange_rate: number;
  formatted_sui: string;
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

  async getSuiRate(): Promise<SuiRateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sui-rate`);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ExchangeService.getSuiRate error:", error);
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

  async convertNgnToSui(nairaAmount: number): Promise<ConvertNgnToSuiResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/convert/ngn-to-sui/${nairaAmount}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ExchangeService.convertNgnToSui error:", error);
      throw error;
    }
  }
}

export const exchangeService = new ExchangeService();
