const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface CurrencyConversion {
  naira_amount: number;
  eth_amount: number;
  exchange_rate: number;
  timestamp: string;
}

export interface ExchangeRate {
  eth_to_ngn: number;
  ngn_to_eth: number;
  timestamp: string;
  cached: boolean;
}

class CurrencyService {
  private cache: { rate: number | null; timestamp: number | null } = {
    rate: null,
    timestamp: null
  };
  private readonly CACHE_DURATION = 300000; // 5 minutes in ms

  async getExchangeRate(): Promise<ExchangeRate> {
    const response = await fetch(`${API_BASE_URL}/eth-rate`);
    if (!response.ok) throw new Error('Failed to fetch exchange rate');
    const data = await response.json();
    return {
      eth_to_ngn: data.eth_to_ngn_rate,
      ngn_to_eth: 1 / data.eth_to_ngn_rate,
      timestamp: data.timestamp,
      cached: data.cache_age_seconds < 300
    };
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<CurrencyConversion> {
    const response = await fetch(`${API_BASE_URL}/convert-currency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        from_currency: fromCurrency,
        to_currency: toCurrency
      })
    });
    if (!response.ok) throw new Error('Failed to convert currency');
    return response.json();
  }

  async getCachedRate(): Promise<number> {
    const now = Date.now();
    
    if (this.cache.rate && this.cache.timestamp && 
        (now - this.cache.timestamp) < this.CACHE_DURATION) {
      return this.cache.rate;
    }

    try {
      const rateData = await this.getExchangeRate();
      this.cache = {
        rate: rateData.eth_to_ngn,
        timestamp: now
      };
      return rateData.eth_to_ngn;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      return 2500000; // Fallback rate
    }
  }

  formatNaira(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatEth(amount: number): string {
    return `${amount.toFixed(6)} ETH`;
  }

  async quickConvertEthToNgn(ethAmount: number): Promise<number> {
    if (!ethAmount || isNaN(ethAmount) || ethAmount < 0) return 0;
    
    try {
      const conversion = await this.convertCurrency(ethAmount, 'ETH', 'NGN');
      return conversion.naira_amount;
    } catch (error) {
      console.warn('API conversion failed, using cached rate:', error);
      const rate = await this.getCachedRate();
      return ethAmount * rate;
    }
  }

  async quickConvertNgnToEth(nairaAmount: number): Promise<number> {
    if (!nairaAmount || isNaN(nairaAmount) || nairaAmount < 0) return 0;
    
    try {
      const conversion = await this.convertCurrency(nairaAmount, 'NGN', 'ETH');
      return conversion.eth_amount;
    } catch (error) {
      console.warn('API conversion failed, using cached rate:', error);
      const rate = await this.getCachedRate();
      return nairaAmount / rate;
    }
  }

  // Legacy methods for backward compatibility
  async convertNgnToEth(nairaAmount: number): Promise<CurrencyConversion> {
    return this.convertCurrency(nairaAmount, 'NGN', 'ETH');
  }

  async convertEthToNgn(ethAmount: number): Promise<CurrencyConversion> {
    return this.convertCurrency(ethAmount, 'ETH', 'NGN');
  }
}

export const currencyService = new CurrencyService();