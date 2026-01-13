// frontend/src/services/currencyService.ts

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export interface CurrencyConversion {
  naira_amount: number;
  mnt_amount: number;
  exchange_rate: number;
  timestamp: string;
}

export interface ExchangeRate {
  mnt_to_ngn: number;
  ngn_to_mnt: number;
  timestamp: string;
  cached: boolean;
}

class CurrencyService {
  /**
   * Fetch the direct MNT rate from the backend
   * Maps to GET /mnt-rate
   */
  async getMntRate(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/mnt-rate`);
      if (!response.ok) throw new Error('Failed to fetch MNT rate');
      const data = await response.json();
      // Handle various possible response structures
      return data.rate || data.mnt_rate || data.mnt_to_ngn || 1200;
    } catch (error) {
      console.warn('Error fetching MNT rate:', error);
      return 1200; // Fallback
    }
  }

  /**
   * Fetch live exchange rate from Backend (Frontend compatibility)
   * Maps to GET /exchange-rate
   */
  async getExchangeRate(): Promise<ExchangeRate> {
    try {
      const response = await fetch(`${API_BASE_URL}/exchange-rate`);
      if (!response.ok) throw new Error('Failed to fetch exchange rate');
      return await response.json();
    } catch (error) {
      console.warn('Error fetching exchange rate, using fallback:', error);
      const fallbackRate = 1200;
      return {
        mnt_to_ngn: fallbackRate,
        ngn_to_mnt: 1 / fallbackRate,
        timestamp: new Date().toISOString(),
        cached: true
      };
    }
  }

  /**
   * Convert NGN to MNT using the dedicated conversion endpoint
   * Maps to GET /convert/ngn-to-mnt/{naira_amount}
   */
  async quickConvertNgnToMnt(amount: number): Promise<number> {
    if (!amount || amount <= 0) return 0;
    try {
      const response = await fetch(`${API_BASE_URL}/convert/ngn-to-mnt/${amount}`);
      if (response.ok) {
        const data = await response.json();
        // Returns the calculated MNT amount from backend precision
        return data.mnt_amount;
      }
    } catch (e) {
      console.warn('Backend conversion failed, calculating locally');
    }
    // Local fallback logic
    const rate = await this.getExchangeRate();
    return amount * rate.ngn_to_mnt;
  }

  /**
   * Get full conversion details for UI display (Rate + Amount + Timestamp)
   */
  async getFullNgnToMntConversion(amount: number): Promise<CurrencyConversion> {
    try {
      const response = await fetch(`${API_BASE_URL}/convert/ngn-to-mnt/${amount}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error("Conversion failed");
    } catch (e) {
      const rate = await this.getExchangeRate();
      return {
        naira_amount: amount,
        mnt_amount: amount * rate.ngn_to_mnt,
        exchange_rate: rate.mnt_to_ngn,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Convert MNT to NGN
   */
  async quickConvertMntToNgn(amount: number): Promise<number> {
    if (!amount || amount <= 0) return 0;
    const rate = await this.getExchangeRate();
    return amount * rate.mnt_to_ngn;
  }

  async quickConvertNgnToSui(amount: number): Promise<number> {
    return this.quickConvertNgnToMnt(amount);
  }
  
  async quickConvertSuiToNgn(amount: number): Promise<number> {
    return this.quickConvertMntToNgn(amount);
  }

  // --- MIGRATION ALIASES (Fixes 'Eth' calls in legacy components) ---

  async quickConvertNgnToEth(amount: number): Promise<number> {
    return this.quickConvertNgnToMnt(amount);
  }

  async quickConvertEthToNgn(amount: number): Promise<number> {
    return this.quickConvertMntToNgn(amount);
  }

  formatEth(amount: number): string {
    return this.formatMnt(amount);
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

  formatMnt(amount: number): string {
    return `${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 4 
    })} MNT`;
  }

  formatSui(amount: number): string {
    return this.formatMnt(amount);
  }
}

export const currencyService = new CurrencyService();