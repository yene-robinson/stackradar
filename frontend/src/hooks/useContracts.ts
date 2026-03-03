/**
 * StackRadar Contract Hooks
 * 
 * React hooks for reading contract data with caching and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useStacksWallet';
import {
  getUserProfile,
  getAllUserPositions,
  getUserYieldTotals,
  isUserRegistered,
  getAllYieldSources,
  getActiveYieldSources,
  getPlatformStats,
  getDashboardData,
  getProtocol,
  getProtocolCount,
  getUserTracking,
  estimatePendingYield,
  UserProfile,
  Position,
  YieldSource,
  UserYieldTotals,
} from '@/lib/stacks/read';

// ============================================
// TYPES
// ============================================

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface RefreshableState<T> extends AsyncState<T> {
  refresh: () => void;
}

// ============================================
// BASE HOOK
// ============================================

function useAsync<T>(
  asyncFn: () => Promise<T | null>,
  deps: unknown[] = []
): RefreshableState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    asyncFn()
      .then(data => {
        if (!cancelled) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({ data: null, isLoading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, refreshCounter]);

  const refresh = useCallback(() => {
    setRefreshCounter(c => c + 1);
  }, []);

  return { ...state, refresh };
}

// ============================================
// USER PROFILE HOOKS
// ============================================

/**
 * Get current user's profile data
 */
export function useUserProfile(): RefreshableState<UserProfile> {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return null;
      return getUserProfile(address);
    },
    [address, connected]
  );
}

/**
 * Check if current user is registered
 */
export function useIsRegistered(): RefreshableState<boolean> {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return false;
      return isUserRegistered(address);
    },
    [address, connected]
  );
}

// ============================================
// POSITION HOOKS
// ============================================

/**
 * Get all positions for current user
 */
export function useUserPositions(): RefreshableState<Position[]> {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return [];
      return getAllUserPositions(address);
    },
    [address, connected]
  );
}

/**
 * Get active positions only
 */
export function useActivePositions(): RefreshableState<Position[]> {
  const positions = useUserPositions();
  
  return {
    ...positions,
    data: positions.data?.filter(p => p.isActive) ?? null,
  };
}

// ============================================
// YIELD HOOKS
// ============================================

/**
 * Get all yield sources
 */
export function useYieldSources(): RefreshableState<YieldSource[]> {
  return useAsync(
    async () => getAllYieldSources(),
    []
  );
}

/**
 * Get active yield sources only
 */
export function useActiveYieldSources(): RefreshableState<YieldSource[]> {
  return useAsync(
    async () => getActiveYieldSources(),
    []
  );
}

/**
 * Get user's yield totals
 */
export function useUserYieldTotals(): RefreshableState<UserYieldTotals> {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return null;
      return getUserYieldTotals(address);
    },
    [address, connected]
  );
}

/**
 * Get user's tracking data for a specific source
 */
export function useUserTracking(sourceId: number) {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return null;
      return getUserTracking(address, sourceId);
    },
    [address, connected, sourceId]
  );
}

/**
 * Get estimated pending yield for a source
 */
export function usePendingYield(sourceId: number) {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return 0;
      return estimatePendingYield(address, sourceId);
    },
    [address, connected, sourceId]
  );
}

// ============================================
// PROTOCOL HOOKS
// ============================================

/**
 * Get protocol by ID
 */
export function useProtocol(protocolId: number) {
  return useAsync(
    async () => getProtocol(protocolId),
    [protocolId]
  );
}

/**
 * Get total protocol count
 */
export function useProtocolCount() {
  return useAsync(
    async () => getProtocolCount(),
    []
  );
}

// ============================================
// PLATFORM STATS HOOKS
// ============================================

/**
 * Get platform-wide statistics
 */
export function usePlatformStats() {
  return useAsync(
    async () => getPlatformStats(),
    []
  );
}

// ============================================
// DASHBOARD HOOK
// ============================================

/**
 * Get all dashboard data for current user
 */
export function useDashboardData() {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return null;
      return getDashboardData(address);
    },
    [address, connected]
  );
}

// ============================================
// COMBINED DATA HOOKS
// ============================================

interface PortfolioSummary {
  totalValue: number;
  totalPositions: number;
  activePositions: number;
  totalYieldEarned: number;
  totalYieldClaimed: number;
}

/**
 * Get a summary of the user's portfolio
 */
export function usePortfolioSummary(): RefreshableState<PortfolioSummary> {
  const profile = useUserProfile();
  const yieldTotals = useUserYieldTotals();
  const positions = useUserPositions();

  const isLoading = profile.isLoading || yieldTotals.isLoading || positions.isLoading;
  const error = profile.error || yieldTotals.error || positions.error;

  const data: PortfolioSummary | null = profile.data ? {
    totalValue: profile.data.totalValue,
    totalPositions: profile.data.totalPositions,
    activePositions: positions.data?.filter(p => p.isActive).length ?? 0,
    totalYieldEarned: yieldTotals.data?.totalEarned ?? 0,
    totalYieldClaimed: yieldTotals.data?.totalClaimed ?? 0,
  } : null;

  const refresh = useCallback(() => {
    profile.refresh();
    yieldTotals.refresh();
    positions.refresh();
  }, [profile.refresh, yieldTotals.refresh, positions.refresh]);

  return { data, isLoading, error, refresh };
}

/**
 * Get positions with protocol details
 */
export interface PositionWithProtocol extends Position {
  protocol: {
    name: string;
    isActive: boolean;
  } | null;
}

export function usePositionsWithProtocols(): RefreshableState<PositionWithProtocol[]> {
  const { address, connected } = useWallet();
  
  return useAsync(
    async () => {
      if (!connected || !address) return [];
      
      const positions = await getAllUserPositions(address);
      
      // Get unique protocol IDs
      const protocolIds = [...new Set(positions.map(p => p.protocolId))];
      
      // Fetch all protocols
      const protocolsMap = new Map();
      for (const id of protocolIds) {
        const protocol = await getProtocol(id);
        if (protocol) {
          protocolsMap.set(id, protocol);
        }
      }
      
      // Combine positions with protocols
      return positions.map(position => ({
        ...position,
        protocol: protocolsMap.get(position.protocolId) ?? null,
      }));
    },
    [address, connected]
  );
}
