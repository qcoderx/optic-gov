// frontend/src/components/ui/CurrencyDisplay.tsx

import React, { useState, useEffect } from 'react';
import { currencyService } from '../../services/currencyService';

interface CurrencyDisplayProps {
  suiAmount?: number;
  nairaAmount?: number;
  // Legacy prop support
  ethAmount?: number; 
  showBoth?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  suiAmount,
  nairaAmount,
  ethAmount,
  showBoth = false,
  className = ''
}) => {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle legacy ethAmount prop by treating it as suiAmount
  const effectiveSuiAmount = suiAmount || ethAmount;

  useEffect(() => {
    const convert = async () => {
      if ((!effectiveSuiAmount || effectiveSuiAmount <= 0) && (!nairaAmount || nairaAmount <= 0)) {
        setConvertedAmount(null);
        return;
      }
      
      setLoading(true);
      try {
        if (effectiveSuiAmount && effectiveSuiAmount > 0 && !nairaAmount) {
          // SUI -> NGN
          const ngn = await currencyService.quickConvertSuiToNgn(effectiveSuiAmount);
          setConvertedAmount(ngn);
        } else if (nairaAmount && nairaAmount > 0 && !effectiveSuiAmount) {
          // NGN -> SUI
          const sui = await currencyService.quickConvertNgnToSui(nairaAmount);
          setConvertedAmount(sui);
        } else if (effectiveSuiAmount && nairaAmount) {
          // Both provided, calculate NGN equivalent of the SUI to display comparison or just confirm
          const ngn = await currencyService.quickConvertSuiToNgn(effectiveSuiAmount);
          setConvertedAmount(ngn);
        }
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setConvertedAmount(null);
      } finally {
        setLoading(false);
      }
    };

    convert();
  }, [effectiveSuiAmount, nairaAmount]);

  if (loading) {
    return <span className={`animate-pulse ${className}`}>Loading...</span>;
  }

  if (showBoth) {
    const displayNaira = nairaAmount || convertedAmount;
    const displaySui = effectiveSuiAmount || (nairaAmount ? convertedAmount : 0);
    
    return (
      <div className={className}>
        <div className="text-sm font-semibold text-[#38e07b]">
          {displayNaira ? currencyService.formatNaira(displayNaira) : '₦0'}
        </div>
        <div className="text-xs text-gray-400">
          {displaySui ? currencyService.formatSui(displaySui) : '0.00 SUI'}
        </div>
      </div>
    );
  }

  if (effectiveSuiAmount && convertedAmount) {
    return (
      <span className={`text-[#38e07b] font-semibold ${className}`}>
        {currencyService.formatNaira(convertedAmount)}
      </span>
    );
  }

  if (nairaAmount) {
    return (
      <span className={`text-[#38e07b] font-semibold ${className}`}>
        {currencyService.formatNaira(nairaAmount)}
      </span>
    );
  }

  return null;
};