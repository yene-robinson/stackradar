/**
 * StackRadar Portfolio History Hooks
 * 
 * React hooks for fetching and displaying portfolio history
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useStacksWallet';
import {
  getPortfolioHistory,
  getPortfolioStats,
  clearPortfolioHistoryCache,
  PortfolioHistoryPoint,
} from '@/services/portfolioHistoryService';

// ============================================
// TYPES
// ============================================

export interface PortfolioHistoryState {
  data: PortfolioHistoryPoint[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  range: PortfolioRange;
}

export type PortfolioRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface PortfolioStatsState {
  currentValue: number;
  change24h: number;
  change24hPercent: number;
  change7d: number;
  change7dPercent: number;
  change30d: number;
  change30dPercent: number;
  allTimeHigh: number;
  allTimeLow: number;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// RANGE TO DAYS MAPPING
// ============================================

const rangeToDays: Record<PortfolioRange, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'ALL': 365, // Limit to 1 year for performance
};

// ============================================
// usePortfolioHistory HOOK
// ============================================

export function usePortfolioHistory(initialRange: PortfolioRange = '1M') {
  const { address, connected } = useWallet();
  const [state, setState] = useState<PortfolioHistoryState>({
    data: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    range: initialRange,
  });

  const fetchHistory = useCallback(async (range: PortfolioRange) => {
    if (!address || !connected) {
      setState(prev => ({
        ...prev,
        data: [],
        isLoading: false,
        error: null,
        range,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      range,
    }));

    try {
      const days = rangeToDays[range];
      const data = await getPortfolioHistory(address, days);
      
      setState(prev => ({
        ...prev,
        data,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio history',
      }));
    }
  }, [address, connected]);

  // Fetch on mount and when address/range changes
  useEffect(() => {
    fetchHistory(state.range);
  }, [address, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Change range handler
  const setRange = useCallback((range: PortfolioRange) => {
    fetchHistory(range);
  }, [fetchHistory]);

  // Refresh handler
  const refresh = useCallback(() => {
    clearPortfolioHistoryCache();
    fetchHistory(state.range);
  }, [fetchHistory, state.range]);

  return {
    ...state,
    setRange,
    refresh,
    isConnected: connected,
  };
}

// ============================================
// usePortfolioStats HOOK
// ============================================

export function usePortfolioStats() {
  const { address, connected } = useWallet();
  const [state, setState] = useState<PortfolioStatsState>({
    currentValue: 0,
    change24h: 0,
    change24hPercent: 0,
    change7d: 0,
    change7dPercent: 0,
    change30d: 0,
    change30dPercent: 0,
    allTimeHigh: 0,
    allTimeLow: 0,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!address || !connected) {
      setState(prev => ({
        ...prev,
        currentValue: 0,
        change24h: 0,
        change24hPercent: 0,
        change7d: 0,
        change7dPercent: 0,
        change30d: 0,
        change30dPercent: 0,
        allTimeHigh: 0,
        allTimeLow: 0,
        isLoading: false,
        error: null,
      }));
      return;
    }

    const fetchStats = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const stats = await getPortfolioStats(address);
        setState(prev => ({
          ...prev,
          ...stats,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error fetching portfolio stats:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats',
        }));
      }
    };

    fetchStats();
  }, [address, connected]);

  return state;
}

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatChartDate(timestamp: number, range: PortfolioRange): string {
  const date = new Date(timestamp);
  
  switch (range) {
    case '1D':
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    case '1W':
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    case '1M':
    case '3M':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case '1Y':
    case 'ALL':
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export function formatChartValue(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}
