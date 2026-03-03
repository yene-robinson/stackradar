/**
 * StackRadar Read-Only Contract Functions
 * 
 * Functions for reading contract state using @stacks/transactions
 * @see https://docs.stacks.co/stacks.js/reading-from-contracts
 */

import { fetchCallReadOnlyFunction, Cl, cvToValue, ClarityValue } from '@stacks/transactions';
import { CONTRACTS, NETWORK, DEPLOYER_ADDRESS } from './contracts';

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  registeredAt: number;
  totalPositions: number;
  totalValue: number;
  lastUpdated: number;
}

export interface Position {
  protocolId: number;
  positionType: number;
  amount: number;
  entryValue: number;
  entryBlock: number;
  lastUpdated: number;
  isActive: boolean;
}

export interface Protocol {
  name: string;
  contractAddress: string;
  isActive: boolean;
  totalTracked: number;
  registeredAt: number;
}

export interface YieldSource {
  name: string;
  sourceType: number;
  contractAddress: string;
  currentApy: number;
  minDeposit: number;
  tvl: number;
  isActive: boolean;
  lastUpdated: number;
  createdAt: number;
}

export interface UserYieldTracking {
  principalAmount: number;
  accumulatedYield: number;
  lastClaimBlock: number;
  entryBlock: number;
  entryApy: number;
}

export interface UserYieldTotals {
  totalEarned: number;
  totalClaimed: number;
  sourcesCount: number;
  lastUpdated: number;
}

export interface PortfolioSnapshot {
  totalValue: number;
  positionCount: number;
  timestamp: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Execute a read-only contract call
 */
async function readContract<T>(
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress?: string
): Promise<T | null> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: DEPLOYER_ADDRESS,
      contractName,
      functionName,
      functionArgs,
      senderAddress: senderAddress || DEPLOYER_ADDRESS,
      network: NETWORK,
    });

    const result = cvToValue(response);
    return result as T;
  } catch (error) {
    console.error(`Error calling ${contractName}.${functionName}:`, error);
    return null;
  }
}

/**
 * Parse optional Clarity value (some/none)
 */
function parseOptional<T>(value: { value?: T } | null | undefined): T | null {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value ?? null;
  }
  return null;
}

// ============================================
// PORTFOLIO TRACKER READ FUNCTIONS
// ============================================

/**
 * Get user profile data
 */
export async function getUserProfile(userAddress: string): Promise<UserProfile | null> {
  const result = await readContract<{ value?: {
    'registered-at': bigint;
    'total-positions': bigint;
    'total-value': bigint;
    'last-updated': bigint;
  }}>(
    CONTRACTS.portfolioTracker.name,
    'get-user-profile',
    [Cl.principal(userAddress)],
    userAddress
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    registeredAt: Number(data['registered-at']),
    totalPositions: Number(data['total-positions']),
    totalValue: Number(data['total-value']),
    lastUpdated: Number(data['last-updated']),
  };
}

/**
 * Get a specific position for a user
 */
export async function getPosition(userAddress: string, positionId: number): Promise<Position | null> {
  const result = await readContract<{ value?: {
    'protocol-id': bigint;
    'position-type': bigint;
    'amount': bigint;
    'entry-value': bigint;
    'entry-block': bigint;
    'last-updated': bigint;
    'is-active': boolean;
  }}>(
    CONTRACTS.portfolioTracker.name,
    'get-position',
    [Cl.principal(userAddress), Cl.uint(positionId)],
    userAddress
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    protocolId: Number(data['protocol-id']),
    positionType: Number(data['position-type']),
    amount: Number(data['amount']),
    entryValue: Number(data['entry-value']),
    entryBlock: Number(data['entry-block']),
    lastUpdated: Number(data['last-updated']),
    isActive: data['is-active'],
  };
}

/**
 * Get user's total position count
 */
export async function getUserPositionCount(userAddress: string): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.portfolioTracker.name,
    'get-user-position-count',
    [Cl.principal(userAddress)],
    userAddress
  );

  return result ? Number(result) : 0;
}

/**
 * Get all positions for a user
 */
export async function getAllUserPositions(userAddress: string): Promise<Position[]> {
  const count = await getUserPositionCount(userAddress);
  const positions: Position[] = [];

  for (let i = 1; i <= count; i++) {
    const position = await getPosition(userAddress, i);
    if (position) {
      positions.push(position);
    }
  }

  return positions;
}

/**
 * Get protocol info by ID
 */
export async function getProtocol(protocolId: number): Promise<Protocol | null> {
  const result = await readContract<{ value?: {
    'name': string;
    'contract-address': string;
    'is-active': boolean;
    'total-tracked': bigint;
    'registered-at': bigint;
  }}>(
    CONTRACTS.portfolioTracker.name,
    'get-protocol',
    [Cl.uint(protocolId)]
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    name: data['name'],
    contractAddress: data['contract-address'],
    isActive: data['is-active'],
    totalTracked: Number(data['total-tracked']),
    registeredAt: Number(data['registered-at']),
  };
}

/**
 * Get protocol ID by name
 */
export async function getProtocolIdByName(name: string): Promise<number | null> {
  const result = await readContract<{ value?: bigint }>(
    CONTRACTS.portfolioTracker.name,
    'get-protocol-id-by-name',
    [Cl.stringAscii(name)]
  );

  const data = parseOptional(result);
  return data ? Number(data) : null;
}

/**
 * Get portfolio snapshot at a specific block
 */
export async function getSnapshot(userAddress: string, snapshotBlock: number): Promise<PortfolioSnapshot | null> {
  const result = await readContract<{ value?: {
    'total-value': bigint;
    'position-count': bigint;
    'timestamp': bigint;
  }}>(
    CONTRACTS.portfolioTracker.name,
    'get-snapshot',
    [Cl.principal(userAddress), Cl.uint(snapshotBlock)],
    userAddress
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    totalValue: Number(data['total-value']),
    positionCount: Number(data['position-count']),
    timestamp: Number(data['timestamp']),
  };
}

/**
 * Get total registered users
 */
export async function getTotalUsers(): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.portfolioTracker.name,
    'get-total-users',
    []
  );

  return result ? Number(result) : 0;
}

/**
 * Get total tracked value across all users
 */
export async function getTotalTrackedValue(): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.portfolioTracker.name,
    'get-total-tracked-value',
    []
  );

  return result ? Number(result) : 0;
}

/**
 * Get total protocol count
 */
export async function getProtocolCount(): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.portfolioTracker.name,
    'get-protocol-count',
    []
  );

  return result ? Number(result) : 0;
}

/**
 * Check if a user is registered
 */
export async function isUserRegistered(userAddress: string): Promise<boolean> {
  const result = await readContract<boolean>(
    CONTRACTS.portfolioTracker.name,
    'is-user-registered',
    [Cl.principal(userAddress)],
    userAddress
  );

  return result ?? false;
}

// ============================================
// YIELD AGGREGATOR READ FUNCTIONS
// ============================================

/**
 * Get yield source info by ID
 */
export async function getYieldSource(sourceId: number): Promise<YieldSource | null> {
  const result = await readContract<{ value?: {
    'name': string;
    'source-type': bigint;
    'contract-address': string;
    'current-apy': bigint;
    'min-deposit': bigint;
    'tvl': bigint;
    'is-active': boolean;
    'last-updated': bigint;
    'created-at': bigint;
  }}>(
    CONTRACTS.yieldAggregator.name,
    'get-yield-source',
    [Cl.uint(sourceId)]
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    name: data['name'],
    sourceType: Number(data['source-type']),
    contractAddress: data['contract-address'],
    currentApy: Number(data['current-apy']),
    minDeposit: Number(data['min-deposit']),
    tvl: Number(data['tvl']),
    isActive: data['is-active'],
    lastUpdated: Number(data['last-updated']),
    createdAt: Number(data['created-at']),
  };
}

/**
 * Get yield source ID by name
 */
export async function getYieldSourceIdByName(name: string): Promise<number | null> {
  const result = await readContract<{ value?: bigint }>(
    CONTRACTS.yieldAggregator.name,
    'get-source-id-by-name',
    [Cl.stringAscii(name)]
  );

  const data = parseOptional(result);
  return data ? Number(data) : null;
}

/**
 * Get APY at a specific block
 */
export async function getApyAtBlock(sourceId: number, targetBlock: number): Promise<{ apy: number; tvl: number; timestamp: number } | null> {
  const result = await readContract<{ value?: {
    'apy': bigint;
    'tvl': bigint;
    'timestamp': bigint;
  }}>(
    CONTRACTS.yieldAggregator.name,
    'get-apy-at-block',
    [Cl.uint(sourceId), Cl.uint(targetBlock)]
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    apy: Number(data['apy']),
    tvl: Number(data['tvl']),
    timestamp: Number(data['timestamp']),
  };
}

/**
 * Get user tracking data for a yield source
 */
export async function getUserTracking(userAddress: string, sourceId: number): Promise<UserYieldTracking | null> {
  const result = await readContract<{ value?: {
    'principal-amount': bigint;
    'accumulated-yield': bigint;
    'last-claim-block': bigint;
    'entry-block': bigint;
    'entry-apy': bigint;
  }}>(
    CONTRACTS.yieldAggregator.name,
    'get-user-tracking',
    [Cl.principal(userAddress), Cl.uint(sourceId)],
    userAddress
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    principalAmount: Number(data['principal-amount']),
    accumulatedYield: Number(data['accumulated-yield']),
    lastClaimBlock: Number(data['last-claim-block']),
    entryBlock: Number(data['entry-block']),
    entryApy: Number(data['entry-apy']),
  };
}

/**
 * Get user total yield data
 */
export async function getUserYieldTotals(userAddress: string): Promise<UserYieldTotals | null> {
  const result = await readContract<{ value?: {
    'total-earned': bigint;
    'total-claimed': bigint;
    'sources-count': bigint;
    'last-updated': bigint;
  }}>(
    CONTRACTS.yieldAggregator.name,
    'get-user-yield-totals',
    [Cl.principal(userAddress)],
    userAddress
  );

  const data = parseOptional(result);
  if (!data) return null;

  return {
    totalEarned: Number(data['total-earned']),
    totalClaimed: Number(data['total-claimed']),
    sourcesCount: Number(data['sources-count']),
    lastUpdated: Number(data['last-updated']),
  };
}

/**
 * Get total yield sources count
 */
export async function getTotalSources(): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.yieldAggregator.name,
    'get-total-sources',
    []
  );

  return result ? Number(result) : 0;
}

/**
 * Get total yield distributed
 */
export async function getTotalYieldDistributed(): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.yieldAggregator.name,
    'get-total-yield-distributed',
    []
  );

  return result ? Number(result) : 0;
}

/**
 * Get oracle address
 */
export async function getOracle(): Promise<string | null> {
  const result = await readContract<string>(
    CONTRACTS.yieldAggregator.name,
    'get-oracle',
    []
  );

  return result ?? null;
}

/**
 * Estimate pending yield for a user
 */
export async function estimatePendingYield(userAddress: string, sourceId: number): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.yieldAggregator.name,
    'estimate-pending-yield',
    [Cl.principal(userAddress), Cl.uint(sourceId)],
    userAddress
  );

  return result ? Number(result) : 0;
}

/**
 * Convert APY to daily rate
 */
export async function apyToDailyRate(apy: number): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.yieldAggregator.name,
    'apy-to-daily-rate',
    [Cl.uint(apy)]
  );

  return result ? Number(result) : 0;
}

/**
 * Get active sources count
 */
export async function getActiveSourcesCount(): Promise<number> {
  const result = await readContract<bigint>(
    CONTRACTS.yieldAggregator.name,
    'get-active-sources-count',
    []
  );

  return result ? Number(result) : 0;
}

/**
 * Get all yield sources
 */
export async function getAllYieldSources(): Promise<YieldSource[]> {
  const count = await getTotalSources();
  const sources: YieldSource[] = [];

  for (let i = 1; i <= count; i++) {
    const source = await getYieldSource(i);
    if (source) {
      sources.push(source);
    }
  }

  return sources;
}

/**
 * Get all active yield sources
 */
export async function getActiveYieldSources(): Promise<YieldSource[]> {
  const sources = await getAllYieldSources();
  return sources.filter(source => source.isActive);
}

// ============================================
// AGGREGATE FUNCTIONS
// ============================================

/**
 * Get complete dashboard data for a user
 */
export async function getDashboardData(userAddress: string) {
  const [
    profile,
    positions,
    yieldTotals,
    isRegistered,
  ] = await Promise.all([
    getUserProfile(userAddress),
    getAllUserPositions(userAddress),
    getUserYieldTotals(userAddress),
    isUserRegistered(userAddress),
  ]);

  return {
    profile,
    positions,
    yieldTotals,
    isRegistered,
  };
}

/**
 * Get platform statistics
 */
export async function getPlatformStats() {
  const [
    totalUsers,
    totalTrackedValue,
    protocolCount,
    totalSources,
    activeSourcesCount,
    totalYieldDistributed,
  ] = await Promise.all([
    getTotalUsers(),
    getTotalTrackedValue(),
    getProtocolCount(),
    getTotalSources(),
    getActiveSourcesCount(),
    getTotalYieldDistributed(),
  ]);

  return {
    totalUsers,
    totalTrackedValue,
    protocolCount,
    totalSources,
    activeSourcesCount,
    totalYieldDistributed,
  };
}
