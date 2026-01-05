import React, { useState, useEffect, useCallback } from 'react';
import { currencyService } from '@/services/currencyService';
import { Icon } from '@/components/ui/Icon';
import debounce from 'lodash/debounce';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number, currency: 'NGN' | 'MNT') => void;
  currency: 'NGN' | 'MNT';
  onCurrencyChange: (currency: 'NGN' | 'MNT') => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency,
  onCurrencyChange,
}) => {
  const [mntValue, setMntValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const convert = useCallback(
    debounce(async (val: number, curr: 'NGN' | 'MNT') => {
      if (!val || val <= 0) {
        setMntValue(0);
        return;
      }
      setLoading(true);
      try {
        if (curr === 'NGN') {
          // Use the MNT function explicitly
          const result = await currencyService.quickConvertNgnToMnt(val);
          setMntValue(result);
        } else {
          setMntValue(val);
        }
      } catch (error) {
        console.error("Conversion failed:", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    convert(value, currency);
  }, [value, currency, convert]);

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex bg-[#29382f] rounded-xl overflow-hidden h-14 border border-transparent focus-within:border-[#38e07b] transition-all">
        <input
          type="number"
          className="flex-1 bg-transparent border-none text-white px-4 outline-none font-medium"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value), currency)}
          placeholder="0.00"
        />
        <select 
          className="bg-[#1a211e] text-[#38e07b] font-bold px-4 outline-none border-l border-[#29382f] cursor-pointer"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as 'NGN' | 'MNT')}
        >
          <option value="NGN">NGN</option>
          <option value="MNT">MNT</option>
        </select>
      </div>
      
      {currency === 'NGN' && (
        <div className="flex items-center gap-2 px-2 text-xs text-[#9eb7a8]">
          <Icon name="swap_horiz" size="sm" className={loading ? "animate-spin" : ""} />
          <span>Approx. {mntValue.toFixed(4)} MNT</span>
        </div>
      )}
    </div>
  );
};