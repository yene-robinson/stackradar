/**
 * StackRadar Data Hooks
 * 
 * React hooks for fetching and caching blockchain data
 * Uses the data service to transform contract data for UI
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useStacksWallet';
import {
  fetchPositions,
  fetchYieldOpportunities,
  fetchProtocols,
  getPortfolioStats,
  Position,
  YieldOpportunity,
  Protocol,
  PortfolioStats,
} from '@/services/dataService';

// Import mock data as fallback
import {
  positions as mockPositions,
  yieldOpportunities as mockYieldOpportunities,
  protocols as mockProtocols,
  portfolioStats as mockPortfolioStats,
} from '@/data/mock';

// ============================================
// TYPES
// ============================================

interface DataState<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  isFromContract: boolean;
}

interface RefreshableDataState<T> extends DataState<T> {
  refresh: () => void;
}

// ============================================
// CONFIGURATION
// ============================================

// Set to true to use blockchain data, false for mock data
const USE_BLOCKCHAIN_DATA = true;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================
// HOOK: usePositions
// ============================================

export function usePositions(): RefreshableDataState<Position[]> {
  const { address, connected } = useWallet();
  const [state, setState] = useState<DataState<Position[]>>({
    data: [],
    isLoading: true,
    error: null,
    isFromContract: false,
  });
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check cache first
      const cacheKey = `positions-${address}`;
      const cached = getCached<Position[]>(cacheKey);
      if (cached) {
        setState({ data: cached, isLoading: false, error: null, isFromContract: true });
        return;
      }

      if (!USE_BLOCKCHAIN_DATA || !connected || !address) {
        // Use mock data
        setState({ data: mockPositions, isLoading: false, error: null, isFromContract: false });
        return;
      }

      try {
        const positions = await fetchPositions(address);
        if (!cancelled) {
          // If no positions from contract, fall back to mock
          if (positions.length === 0) {
            setState({ data: mockPositions, isLoading: false, error: null, isFromContract: false });
          } else {
            setCache(cacheKey, positions);
            setState({ data: positions, isLoading: false, error: null, isFromContract: true });
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading positions:', error);
          // Fall back to mock data on error
          setState({ data: mockPositions, isLoading: false, error: error as Error, isFromContract: false });
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [address, connected, refreshCount]);

  const refresh = useCallback(() => {
    cache.delete(`positions-${address}`);
    setRefreshCount(c => c + 1);
  }, [address]);

  return { ...state, refresh };
}

// ============================================
// HOOK: useYieldOpportunities
// ============================================

export function useYieldOpportunities(): RefreshableDataState<YieldOpportunity[]> {
  const [state, setState] = useState<DataState<YieldOpportunity[]>>({
    data: [],
    isLoading: true,
    error: null,
    isFromContract: false,
  });
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check cache first
      const cacheKey = 'yield-opportunities';
      const cached = getCached<YieldOpportunity[]>(cacheKey);
      if (cached) {
        setState({ data: cached, isLoading: false, error: null, isFromContract: true });
        return;
      }

      if (!USE_BLOCKCHAIN_DATA) {
        setState({ data: mockYieldOpportunities, isLoading: false, error: null, isFromContract: false });
        return;
      }

      try {
        const opportunities = await fetchYieldOpportunities();
        if (!cancelled) {
          if (opportunities.length === 0) {
            setState({ data: mockYieldOpportunities, isLoading: false, error: null, isFromContract: false });
          } else {
            setCache(cacheKey, opportunities);
            setState({ data: opportunities, isLoading: false, error: null, isFromContract: true });
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading yield opportunities:', error);
          setState({ data: mockYieldOpportunities, isLoading: false, error: error as Error, isFromContract: false });
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [refreshCount]);

  const refresh = useCallback(() => {
    cache.delete('yield-opportunities');
    setRefreshCount(c => c + 1);
  }, []);

  return { ...state, refresh };
}

// ============================================
// HOOK: useProtocols
// ============================================

export function useProtocols(): RefreshableDataState<Protocol[]> {
  const [state, setState] = useState<DataState<Protocol[]>>({
    data: mockProtocols,
    isLoading: true,
    error: null,
    isFromContract: false,
  });
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setState(prev => ({ ...prev, isLoading: true }));

      if (!USE_BLOCKCHAIN_DATA) {
        setState({ data: mockProtocols, isLoading: false, error: null, isFromContract: false });
        return;
      }

      try {
        const protocols = await fetchProtocols();
        if (!cancelled) {
          // Merge with mock protocols to ensure we have icons/colors
          const merged = protocols.length > 0 ? protocols : mockProtocols;
          setState({ data: merged, isLoading: false, error: null, isFromContract: protocols.length > 0 });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: mockProtocols, isLoading: false, error: error as Error, isFromContract: false });
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [refreshCount]);

  const refresh = useCallback(() => setRefreshCount(c => c + 1), []);

  return { ...state, refresh };
}

// ============================================
// HOOK: usePortfolioStats
// ============================================

export function usePortfolioStats(): RefreshableDataState<PortfolioStats> {
  const { address, connected } = useWallet();
  const [state, setState] = useState<DataState<PortfolioStats>>({
    data: mockPortfolioStats,
    isLoading: true,
    error: null,
    isFromContract: false,
  });
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const cacheKey = `portfolio-stats-${address}`;
      const cached = getCached<PortfolioStats>(cacheKey);
      if (cached) {
        setState({ data: cached, isLoading: false, error: null, isFromContract: true });
        return;
      }

      if (!USE_BLOCKCHAIN_DATA || !connected || !address) {
        setState({ data: mockPortfolioStats, isLoading: false, error: null, isFromContract: false });
        return;
      }

      try {
        const stats = await getPortfolioStats(address);
        if (!cancelled) {
          // If no real data, use mock
          if (stats.totalValue === 0) {
            setState({ data: mockPortfolioStats, isLoading: false, error: null, isFromContract: false });
          } else {
            setCache(cacheKey, stats);
            setState({ data: stats, isLoading: false, error: null, isFromContract: true });
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading portfolio stats:', error);
          setState({ data: mockPortfolioStats, isLoading: false, error: error as Error, isFromContract: false });
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [address, connected, refreshCount]);

  const refresh = useCallback(() => {
    cache.delete(`portfolio-stats-${address}`);
    setRefreshCount(c => c + 1);
  }, [address]);

  return { ...state, refresh };
}

// ============================================
// HOOK: useDashboardData
// ============================================

interface DashboardData {
  stats: PortfolioStats;
  positions: Position[];
  yieldOpportunities: YieldOpportunity[];
}

export function useDashboardData(): RefreshableDataState<DashboardData> {
  const stats = usePortfolioStats();
  const positions = usePositions();
  const yields = useYieldOpportunities();

  const isLoading = stats.isLoading || positions.isLoading || yields.isLoading;
  const error = stats.error || positions.error || yields.error;
  const isFromContract = stats.isFromContract || positions.isFromContract || yields.isFromContract;

  const data: DashboardData = {
    stats: stats.data,
    positions: positions.data,
    yieldOpportunities: yields.data,
  };

  const refresh = useCallback(() => {
    stats.refresh();
    positions.refresh();
    yields.refresh();
  }, [stats.refresh, positions.refresh, yields.refresh]);

  return { data, isLoading, error, isFromContract, refresh };
}

// ============================================
// HOOK: useActivePositions
// ============================================

export function useActivePositions(): RefreshableDataState<Position[]> {
  const positions = usePositions();
  
  return {
    ...positions,
    data: positions.data.filter(p => p.status === 'active'),
  };
}

// ============================================
// HOOK: useFeaturedYields
// ============================================

export function useFeaturedYields(limit = 3): RefreshableDataState<YieldOpportunity[]> {
  const yields = useYieldOpportunities();
  
  return {
    ...yields,
    data: yields.data
      .sort((a, b) => b.apy - a.apy) // Sort by APY descending
      .slice(0, limit),
  };
}
