/**
 * StackRadar Yield Discovery Hooks
 * 
 * React hooks for auto-discovering yield opportunities
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  discoverYieldOpportunities,
  discoverUserYieldPositions,
  getFeaturedYields,
  getYieldsByProtocol,
  getYieldsByType,
  clearYieldDiscoveryCache,
  getTotalDiscoveredTVL,
  getAverageAPY,
  DiscoveredYield,
  UserYieldPosition,
} from '@/services/yieldDiscoveryService';

// ============================================
// TYPES
// ============================================

export interface YieldDiscoveryState {
  opportunities: DiscoveredYield[];
  featured: DiscoveredYield[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  totalTVL: number;
  averageAPY: number;
}

export interface UserYieldState {
  positions: UserYieldPosition[];
  isLoading: boolean;
  error: string | null;
  totalDeposited: number;
  totalEarned: number;
}

// ============================================
// useYieldDiscovery HOOK
// ============================================

export function useYieldDiscovery() {
  const [state, setState] = useState<YieldDiscoveryState>({
    opportunities: [],
    featured: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
    totalTVL: 0,
    averageAPY: 0,
  });

  const fetchYields = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [opportunities, featured, totalTVL, averageAPY] = await Promise.all([
        discoverYieldOpportunities(),
        getFeaturedYields(),
        getTotalDiscoveredTVL(),
        getAverageAPY(),
      ]);

      setState({
        opportunities,
        featured,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
        totalTVL,
        averageAPY,
      });
    } catch (error) {
      console.error('Error discovering yields:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to discover yields',
      }));
    }
  }, []);

  useEffect(() => {
    fetchYields();
  }, [fetchYields]);

  const refresh = useCallback(() => {
    clearYieldDiscoveryCache();
    fetchYields();
  }, [fetchYields]);

  const filterByProtocol = useCallback(async (protocol: string) => {
    return getYieldsByProtocol(protocol);
  }, []);

  const filterByType = useCallback(async (type: DiscoveredYield['type']) => {
    return getYieldsByType(type);
  }, []);

  return {
    ...state,
    refresh,
    filterByProtocol,
    filterByType,
  };
}

// ============================================
// useUserYieldPositions HOOK
// ============================================

export function useUserYieldPositions() {
  const { address, connected } = useWallet();
  const [state, setState] = useState<UserYieldState>({
    positions: [],
    isLoading: false,
    error: null,
    totalDeposited: 0,
    totalEarned: 0,
  });

  const fetchPositions = useCallback(async () => {
    if (!address || !connected) {
      setState({
        positions: [],
        isLoading: false,
        error: null,
        totalDeposited: 0,
        totalEarned: 0,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const positions = await discoverUserYieldPositions(address);
      
      const totalDeposited = positions.reduce((sum, p) => sum + p.depositedUsd, 0);
      const totalEarned = positions.reduce((sum, p) => sum + p.earnedUsd, 0);

      setState({
        positions,
        isLoading: false,
        error: null,
        totalDeposited,
        totalEarned,
      });
    } catch (error) {
      console.error('Error fetching user yield positions:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch positions',
      }));
    }
  }, [address, connected]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const refresh = useCallback(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    ...state,
    refresh,
    isConnected: connected,
  };
}

// ============================================
// useBestYields HOOK
// ============================================

/**
 * Get the best yields for a specific asset
 */
export function useBestYields(asset?: string, limit = 5) {
  const { opportunities, isLoading } = useYieldDiscovery();

  const bestYields = opportunities
    .filter(y => !asset || y.asset.toLowerCase().includes(asset.toLowerCase()))
    .sort((a, b) => b.apy - a.apy)
    .slice(0, limit);

  return {
    yields: bestYields,
    isLoading,
    topAPY: bestYields[0]?.apy || 0,
  };
}

// ============================================
// useYieldComparison HOOK
// ============================================

/**
 * Compare yields across protocols for the same pool type
 */
export function useYieldComparison(poolType: DiscoveredYield['type']) {
  const { opportunities, isLoading } = useYieldDiscovery();

  const byProtocol = opportunities
    .filter(y => y.type === poolType)
    .reduce((acc, y) => {
      if (!acc[y.protocol.name]) {
        acc[y.protocol.name] = [];
      }
      acc[y.protocol.name].push(y);
      return acc;
    }, {} as Record<string, DiscoveredYield[]>);

  // Get best from each protocol
  const comparison = Object.entries(byProtocol).map(([protocol, yields]) => ({
    protocol,
    bestYield: yields.sort((a, b) => b.apy - a.apy)[0],
    totalTVL: yields.reduce((sum, y) => sum + y.tvl, 0),
    poolCount: yields.length,
  }));

  return {
    comparison: comparison.sort((a, b) => b.bestYield.apy - a.bestYield.apy),
    isLoading,
  };
}
