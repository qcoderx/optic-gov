// frontend/src/components/ui/CurrencyInput.tsx

import React, { useState, useEffect } from 'react';
import { currencyService } from '../../services/currencyService';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number, currency: 'NGN' | 'MNT') => void;
  currency: 'NGN' | 'MNT';
  onCurrencyChange: (currency: 'NGN' | 'MNT') => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency,
  onCurrencyChange,
  placeholder,
  className = ''
}) => {
  const [convertedValue, setConvertedValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const convert = async () => {
      if (!value || value <= 0) {
        setConvertedValue(null);
        return;
      }

      setLoading(true);
      try {
        if (currency === 'NGN') {
          // Convert NGN -> MNT
          const mnt = await currencyService.quickConvertNgnToSui(value);
          setConvertedValue(mnt);
        } else {
          // Convert MNT -> NGN
          const ngn = await currencyService.quickConvertSuiToNgn(value);
          setConvertedValue(ngn);
        }
      } catch (error) {
        console.error('Conversion failed:', error);
        setConvertedValue(null);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(convert, 500);
    return () => clearTimeout(debounce);
  }, [value, currency]);

  const handleCurrencyToggle = () => {
    const newCurrency = currency === 'NGN' ? 'MNT' : 'NGN';
    onCurrencyChange(newCurrency);
    
    // If we have a converted value, switch the input to that value for smooth UX
    if (convertedValue && convertedValue > 0) {
      onChange(convertedValue, newCurrency);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            onChange(newValue, currency);
          }}
          placeholder={placeholder}
          className="w-full bg-[#29382f] border-none rounded-xl text-white placeholder:text-[#9eb7a8] h-14 pl-4 pr-20 focus:ring-2 focus:ring-[#38e07b] focus:ring-opacity-50 transition-all font-medium"
          step={currency === 'MNT' ? '0.000001' : '1'}
          min="0"
        />
        <button
          type="button"
          onClick={handleCurrencyToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#38e07b]/20 hover:bg-[#38e07b]/30 text-[#38e07b] px-3 py-1 rounded-lg text-sm font-bold transition-colors"
        >
          {currency}
        </button>
      </div>
      {convertedValue !== null && !loading && (
        <div className="mt-2 text-sm text-[#9eb7a8] flex items-center gap-2">
          <span>≈</span>
          <span>
            {currency === 'NGN' 
              ? currencyService.formatSui(convertedValue)
              : currencyService.formatNaira(convertedValue)
            }
          </span>
        </div>
      )}
      {loading && (
        <div className="mt-2 text-sm text-[#9eb7a8]">
          Converting...
        </div>
      )}
    </div>
  );
};