// frontend/src/services/currencyService.ts

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export interface CurrencyConversion {
  naira_amount: number;
  sui_amount: number;
  exchange_rate: number;
  timestamp: string;
}

export interface ExchangeRate {
  sui_to_ngn: number;
  ngn_to_sui: number;
  timestamp: string;
  cached: boolean;
}

class CurrencyService {
  /**
   * Fetch live exchange rate from Backend
   */
  async getExchangeRate(): Promise<ExchangeRate> {
    try {
      const response = await fetch(`${API_BASE_URL}/exchange-rate`);
      if (!response.ok) throw new Error('Failed to fetch exchange rate');
      return await response.json();
    } catch (error) {
      console.warn('Error fetching exchange rate, using fallback:', error);
      // Fallback if backend is down
      return { 
        sui_to_ngn: 2500, 
        ngn_to_sui: 1/2500, 
        timestamp: new Date().toISOString(), 
        cached: true 
      };
    }
  }

  /**
   * Convert NGN to SUI (Server-side calculation preferred for precision)
   */
  async quickConvertNgnToSui(amount: number): Promise<number> {
    if (!amount || amount <= 0) return 0;
    try {
      const response = await fetch(`${API_BASE_URL}/convert/ngn-to-sui/${amount}`);
      if (response.ok) {
        const data = await response.json();
        return data.sui_amount;
      }
    } catch (e) {
      console.warn('Backend conversion failed, calculating locally');
    }
    // Local fallback
    const rate = await this.getExchangeRate();
    return amount * rate.ngn_to_sui;
  }

  /**
   * Convert SUI to NGN
   */
  async quickConvertSuiToNgn(amount: number): Promise<number> {
    if (!amount || amount <= 0) return 0;
    const rate = await this.getExchangeRate();
    return amount * rate.sui_to_ngn;
  }

  // --- MIGRATION ALIASES (Fixes 'Eth' calls in legacy components) ---
  
  async quickConvertNgnToEth(amount: number): Promise<number> {
    return this.quickConvertNgnToSui(amount);
  }

  async quickConvertEthToNgn(amount: number): Promise<number> {
    return this.quickConvertSuiToNgn(amount);
  }

  formatEth(amount: number): string {
    return this.formatSui(amount);
  }

  // --- FORMATTERS ---

  formatNaira(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatSui(amount: number): string {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SUI`;
  }
}

export const currencyService = new CurrencyService();