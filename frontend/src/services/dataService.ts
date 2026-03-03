/**
 * StackRadar Data Service
 * 
 * Transforms contract data to match UI component expectations
 * Provides a bridge between blockchain data and the existing UI
 */

import { 
  Position as ContractPosition,
  YieldSource as ContractYieldSource,
  UserProfile,
  getProtocol as fetchProtocol,
  getAllUserPositions as fetchUserPositions,
  getAllYieldSources as fetchYieldSources,
  getUserProfile as fetchUserProfile,
  getUserYieldTotals,
  getPlatformStats as fetchPlatformStats,
} from '@/lib/stacks/read';
import { POSITION_TYPE_LABELS } from '@/lib/stacks/contracts';

// ============================================
// UI TYPES (matching existing mock data structure)
// ============================================

export interface Protocol {
  id: string;
  name: string;
  icon: string;
  chain: string;
  verified: boolean;
  color: string;
}

export interface Position {
  id: string;
  protocol: Protocol;
  type: 'Lending' | 'LP Pool' | 'Staking' | 'Vault';
  asset: string;
  amount: number;
  value: number;
  apy: number;
  earned: number;
  status: 'active' | 'pending' | 'inactive';
  depositDate: string;
}

export interface YieldOpportunity {
  id: string;
  protocol: Protocol;
  type: 'Lending' | 'LP Pool' | 'Staking' | 'Vault';
  apy: number;
  tvl: number;
  risk: 'Low' | 'Medium' | 'High';
  minDeposit: number;
  asset: string;
  featured?: boolean;
}

export interface PortfolioStats {
  totalValue: number;
  change24h: number;
  changeValue24h: number;
  totalYield: number;
  yieldChange: number;
  activePositions: number;
}

// ============================================
// PROTOCOL REGISTRY
// ============================================

// Map of known protocols (contract ID -> UI Protocol)
const PROTOCOL_REGISTRY: Map<number, Protocol> = new Map([
  [1, { id: 'alex', name: 'ALEX Lab', icon: 'A', chain: 'Stacks', verified: true, color: '#F7931A' }],
  [2, { id: 'arkadiko', name: 'Arkadiko', icon: 'K', chain: 'Stacks', verified: true, color: '#5546FF' }],
  [3, { id: 'stackswap', name: 'StackSwap', icon: 'S', chain: 'Stacks', verified: true, color: '#22C55E' }],
  [4, { id: 'velar', name: 'Velar', icon: 'V', chain: 'Stacks', verified: true, color: '#EAB308' }],
  [5, { id: 'zest', name: 'Zest Protocol', icon: 'Z', chain: 'Stacks', verified: true, color: '#3B82F6' }],
  [6, { id: 'bitflow', name: 'Bitflow', icon: 'B', chain: 'Stacks', verified: false, color: '#EC4899' }],
]);

// Default protocol for unknown IDs
const DEFAULT_PROTOCOL: Protocol = {
  id: 'unknown',
  name: 'Unknown Protocol',
  icon: '?',
  chain: 'Stacks',
  verified: false,
  color: '#6B7280',
};

// Protocol colors for dynamic assignment
const PROTOCOL_COLORS = ['#F7931A', '#5546FF', '#22C55E', '#EAB308', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get protocol info by ID, fetching from contract if needed
 */
export async function getProtocolInfo(protocolId: number): Promise<Protocol> {
  // Check registry first
  if (PROTOCOL_REGISTRY.has(protocolId)) {
    return PROTOCOL_REGISTRY.get(protocolId)!;
  }
  
  // Try to fetch from contract
  try {
    const contractProtocol = await fetchProtocol(protocolId);
    if (contractProtocol) {
      const protocol: Protocol = {
        id: `protocol-${protocolId}`,
        name: contractProtocol.name,
        icon: contractProtocol.name.charAt(0).toUpperCase(),
        chain: 'Stacks',
        verified: contractProtocol.isActive,
        color: PROTOCOL_COLORS[protocolId % PROTOCOL_COLORS.length],
      };
      // Cache it
      PROTOCOL_REGISTRY.set(protocolId, protocol);
      return protocol;
    }
  } catch (error) {
    console.error('Error fetching protocol:', error);
  }
  
  return DEFAULT_PROTOCOL;
}

/**
 * Convert position type number to UI label
 */
function getPositionType(typeId: number): 'Lending' | 'LP Pool' | 'Staking' | 'Vault' {
  const label = POSITION_TYPE_LABELS[typeId];
  switch (label) {
    case 'Staking': return 'Staking';
    case 'Lending': return 'Lending';
    case 'LP Pool': return 'LP Pool';
    case 'Vault': return 'Vault';
    default: return 'Vault';
  }
}

/**
 * Convert source type to UI type
 */
function getSourceType(typeId: number): 'Lending' | 'LP Pool' | 'Staking' | 'Vault' {
  switch (typeId) {
    case 1: return 'Staking';
    case 2: return 'Lending';
    case 3: return 'LP Pool';
    case 4: return 'Vault';
    default: return 'Vault';
  }
}

/**
 * Calculate risk level based on APY
 */
function calculateRisk(apy: number): 'Low' | 'Medium' | 'High' {
  // APY is in basis points (10000 = 100%)
  const apyPercent = apy / 100;
  if (apyPercent < 8) return 'Low';
  if (apyPercent < 15) return 'Medium';
  return 'High';
}

/**
 * Convert block height to approximate date
 */
function blockToDate(blockHeight: number): string {
  // Stacks: ~10 min per block
  // Calculate approximate date based on current block
  const BLOCKS_PER_DAY = 144; // ~144 blocks/day
  const currentBlock = 180000; // Approximate current testnet block
  const daysAgo = Math.floor((currentBlock - blockHeight) / BLOCKS_PER_DAY);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Convert micro-sBTC to sBTC (8 decimals)
 */
function microToSbtc(micro: number): number {
  return micro / 100000000;
}

/**
 * Get approximate USD value (placeholder - would use oracle in production)
 */
function sbtcToUsd(sbtc: number): number {
  const BTC_PRICE = 63800; // Approximate BTC price
  return sbtc * BTC_PRICE;
}

// ============================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================

/**
 * Transform contract positions to UI positions
 */
export async function transformPositions(
  contractPositions: ContractPosition[],
  userAddress: string
): Promise<Position[]> {
  const positions: Position[] = [];
  
  for (let i = 0; i < contractPositions.length; i++) {
    const cp = contractPositions[i];
    const protocol = await getProtocolInfo(cp.protocolId);
    const amountSbtc = microToSbtc(cp.amount);
    const valueSbtc = microToSbtc(cp.entryValue);
    
    positions.push({
      id: `${i + 1}`,
      protocol,
      type: getPositionType(cp.positionType),
      asset: 'sBTC',
      amount: amountSbtc,
      value: sbtcToUsd(valueSbtc),
      apy: 5.0, // Would come from yield aggregator
      earned: 0, // Would be calculated from yield data
      status: cp.isActive ? 'active' : 'inactive',
      depositDate: blockToDate(cp.entryBlock),
    });
  }
  
  return positions;
}

/**
 * Transform contract yield sources to UI yield opportunities
 */
export async function transformYieldSources(
  contractSources: ContractYieldSource[]
): Promise<YieldOpportunity[]> {
  const opportunities: YieldOpportunity[] = [];
  
  for (let i = 0; i < contractSources.length; i++) {
    const source = contractSources[i];
    
    // Create a protocol entry for this source
    const protocol: Protocol = {
      id: `source-${i + 1}`,
      name: source.name,
      icon: source.name.charAt(0).toUpperCase(),
      chain: 'Stacks',
      verified: source.isActive,
      color: PROTOCOL_COLORS[i % PROTOCOL_COLORS.length],
    };
    
    // APY is in basis points (10000 = 100%)
    const apyPercent = source.currentApy / 100;
    
    opportunities.push({
      id: `${i + 1}`,
      protocol,
      type: getSourceType(source.sourceType),
      apy: apyPercent,
      tvl: microToSbtc(source.tvl) * 63800, // Convert to USD
      risk: calculateRisk(source.currentApy),
      minDeposit: microToSbtc(source.minDeposit),
      asset: 'sBTC',
      featured: i === 0, // Feature the first one
    });
  }
  
  return opportunities;
}

/**
 * Get user portfolio stats
 */
export async function getPortfolioStats(userAddress: string): Promise<PortfolioStats> {
  try {
    const [profile, yieldTotals, platformStats] = await Promise.all([
      fetchUserProfile(userAddress),
      getUserYieldTotals(userAddress),
      fetchPlatformStats(),
    ]);
    
    if (!profile) {
      return {
        totalValue: 0,
        change24h: 0,
        changeValue24h: 0,
        totalYield: 0,
        yieldChange: 0,
        activePositions: 0,
      };
    }
    
    const totalValueUsd = sbtcToUsd(microToSbtc(profile.totalValue));
    const totalYieldUsd = yieldTotals ? sbtcToUsd(microToSbtc(yieldTotals.totalEarned)) : 0;
    
    return {
      totalValue: totalValueUsd,
      change24h: 2.4, // Would need historical data
      changeValue24h: totalValueUsd * 0.024, // Estimate
      totalYield: totalYieldUsd,
      yieldChange: 12.8, // Would need historical data
      activePositions: profile.totalPositions,
    };
  } catch (error) {
    console.error('Error fetching portfolio stats:', error);
    return {
      totalValue: 0,
      change24h: 0,
      changeValue24h: 0,
      totalYield: 0,
      yieldChange: 0,
      activePositions: 0,
    };
  }
}

// ============================================
// EXPORTED DATA FETCHERS
// ============================================

/**
 * Fetch user positions from contract
 */
export async function fetchPositions(userAddress: string): Promise<Position[]> {
  try {
    const contractPositions = await fetchUserPositions(userAddress);
    return transformPositions(contractPositions, userAddress);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

/**
 * Fetch yield opportunities from contract
 */
export async function fetchYieldOpportunities(): Promise<YieldOpportunity[]> {
  try {
    const contractSources = await fetchYieldSources();
    return transformYieldSources(contractSources);
  } catch (error) {
    console.error('Error fetching yield opportunities:', error);
    return [];
  }
}

/**
 * Fetch protocols list
 */
export async function fetchProtocols(): Promise<Protocol[]> {
  // Return known protocols
  return Array.from(PROTOCOL_REGISTRY.values());
}

// ============================================
// UTILITY EXPORTS
// ============================================

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

export const formatBTC = (value: number): string => `${value.toFixed(4)} sBTC`;
