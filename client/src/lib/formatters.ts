import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Define currency settings type for clarity
export interface CurrencySettings {
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces?: number;
  currency?: string;
}

// Default currency settings (used before fetching actual settings)
const defaultCurrencySettings: CurrencySettings = {
  symbol: '€',
  position: 'before',
  decimalPlaces: 0,
  currency: 'EUR'
};

/**
 * Format a price according to the current currency settings
 * @param price - The price to format
 * @param settings - Currency settings override (optional)
 * @returns Formatted price string
 */
export function formatPrice(price: number, settings?: CurrencySettings): string {
  // Get settings from parameter or use default
  const defaultSettings = defaultCurrencySettings;
  const settings_ = settings || defaultSettings;
  
  const symbol = settings_.symbol || defaultSettings.symbol;
  const position = settings_.position || defaultSettings.position;
  const decimalPlaces = settings_.decimalPlaces ?? defaultSettings.decimalPlaces;
  
  // Format the number with appropriate decimal places
  const formattedNumber = price.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  
  // Apply symbol based on position setting
  if (position === 'before') {
    return `${symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${symbol}`;
  }
}

/**
 * React hook to get currency settings and format prices
 * @returns Object with loading state, settings, and formatter function
 */
export function useCurrency() {
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(defaultCurrencySettings);
  
  // Fetch current currency settings from API (uses the public currency endpoint)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/settings/currency'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Update settings when data is fetched
  useEffect(() => {
    if (settings && typeof settings === 'object') {
      // Handle different property names between API and our interface
      // Use any type to access properties safely
      const settingsObj: any = settings; 
      
      const normalizedSettings: CurrencySettings = {
        symbol: typeof settingsObj.symbol === 'string' ? settingsObj.symbol : defaultCurrencySettings.symbol,
        position: (settingsObj.position || settingsObj.symbolPosition) === 'after' ? 'after' : 'before',
        decimalPlaces: typeof settingsObj.decimalPlaces === 'number' ? settingsObj.decimalPlaces : 0,
        currency: typeof settingsObj.currency === 'string' ? settingsObj.currency : 'EUR'
      };
      
      setCurrencySettings(normalizedSettings);
    }
  }, [settings]);
  
  // Return formatter function that uses the latest settings
  const formatPriceWithCurrentSettings = (price: number) => {
    return formatPrice(price, currencySettings);
  };
  
  return {
    isLoading,
    settings: currencySettings,
    formatPrice: formatPriceWithCurrentSettings,
  };
}