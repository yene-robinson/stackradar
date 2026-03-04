/**
 * StackRadar Price Hook
 * 
 * React hook for real-time token prices
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PriceData, 
  getPrices, 
  getCachedPrices, 
  refreshPrices,
  formatUSD,
  formatPercentChange,
  calculateUSDValue,
} from '@/services/priceService';

interface UsePricesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in ms, defaults to 60s
}

interface UsePricesResult {
  prices: PriceData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  formatUSD: typeof formatUSD;
  formatPercentChange: typeof formatPercentChange;
  calculateUSDValue: (amount: number, token: 'stx' | 'btc' | 'sbtc') => number;
  stxPrice: number;
  btcPrice: number;
  sbtcPrice: number;
  stx24hChange: number;
  btc24hChange: number;
}

export function usePrices(options: UsePricesOptions = {}): UsePricesResult {
  const { autoRefresh = true, refreshInterval = 60_000 } = options;
  
  // Start with cached prices for instant render
  const [prices, setPrices] = useState<PriceData>(getCachedPrices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await refreshPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to refresh prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh prices');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchPrices();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchPrices, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchPrices, autoRefresh, refreshInterval]);

  // Helper function bound to current prices
  const calculateUSDValueBound = useCallback(
    (amount: number, token: 'stx' | 'btc' | 'sbtc') => calculateUSDValue(amount, token, prices),
    [prices]
  );

  return {
    prices,
    loading,
    error,
    refresh,
    formatUSD,
    formatPercentChange,
    calculateUSDValue: calculateUSDValueBound,
    stxPrice: prices.stx.usd,
    btcPrice: prices.btc.usd,
    sbtcPrice: prices.sbtc.usd,
    stx24hChange: prices.stx.usd_24h_change,
    btc24hChange: prices.btc.usd_24h_change,
  };
}

/**
 * Simple hook to get just the STX price
 */
export function useStxPrice(): { price: number; change: number; loading: boolean } {
  const { stxPrice, stx24hChange, loading } = usePrices();
  return { price: stxPrice, change: stx24hChange, loading };
}

/**
 * Simple hook to get just the sBTC/BTC price
 */
export function useSbtcPrice(): { price: number; change: number; loading: boolean } {
  const { sbtcPrice, btc24hChange, loading } = usePrices();
  return { price: sbtcPrice, change: btc24hChange, loading };
}

/**
 * Hook to calculate portfolio value in USD
 */
export function usePortfolioValue(stxAmount: number, sbtcAmount: number) {
  const { prices, loading } = usePrices();
  
  const stxValue = stxAmount * prices.stx.usd;
  const sbtcValue = sbtcAmount * prices.sbtc.usd;
  const totalValue = stxValue + sbtcValue;
  
  return {
    stxValue,
    sbtcValue,
    totalValue,
    loading,
    isStale: prices.isStale,
  };
}
