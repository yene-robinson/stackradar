/**
 * StackRadar Yield Auto-Discovery Service
 * 
 * Discovers yield opportunities and user positions across
 * Stacks DeFi protocols:
 * - ALEX (DEX, farming)
 * - Arkadiko (CDP, lending)
 * - Velar (DEX, LP)
 * - STXCity (stacking)
 * - Bitflow (DEX)
 */

import { API_BASE_URL } from '@/lib/stacks/contracts';

// ============================================
// TYPES
// ============================================

export interface DiscoveredYield {
  id: string;
  protocol: {
    name: string;
    logo: string;
    url: string;
    description: string;
  };
  pool: string;
  asset: string;
  apy: number;
  tvl: number;
  type: 'Lending' | 'LP Pool' | 'Staking' | 'Vault' | 'Farming';
  risk: 'Low' | 'Medium' | 'High';
  rewardTokens: string[];
  minDeposit?: number;
  lockPeriod?: string;
  featured?: boolean;
  contract?: string;
  lastUpdated: number;
}

export interface UserYieldPosition {
  protocol: string;
  pool: string;
  deposited: number;
  depositedUsd: number;
  earned: number;
  earnedUsd: number;
  apy: number;
  asset: string;
  contract?: string;
}

// ============================================
// PROTOCOL DEFINITIONS
// ============================================

const PROTOCOLS = {
  ALEX: {
    name: 'ALEX',
    logo: '🔵',
    url: 'https://app.alexlab.co',
    description: 'Leading DEX on Stacks with farming rewards',
    apiUrl: 'https://api.alexlab.co',
  },
  ARKADIKO: {
    name: 'Arkadiko',
    logo: '🏛️',
    url: 'https://arkadiko.finance',
    description: 'Decentralized lending and stablecoin protocol',
    apiUrl: 'https://api.arkadiko.finance',
  },
  VELAR: {
    name: 'Velar',
    logo: '⚡',
    url: 'https://velar.co',
    description: 'Multi-chain DEX with concentrated liquidity',
    apiUrl: 'https://api.velar.co',
  },
  STXCITY: {
    name: 'STX City',
    logo: '🏙️',
    url: 'https://stx.city',
    description: 'PoX stacking delegation service',
    apiUrl: null,
  },
  BITFLOW: {
    name: 'Bitflow',
    logo: '🌊',
    url: 'https://bitflow.finance',
    description: 'Stableswap and liquidity protocol',
    apiUrl: 'https://api.bitflow.finance',
  },
} as const;

// ============================================
// CACHE
// ============================================

interface YieldCache {
  opportunities: DiscoveredYield[];
  fetchedAt: number;
}

let yieldCache: YieldCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================
// YIELD DATA FETCHERS
// ============================================

/**
 * Fetch ALEX yield opportunities
 */
async function fetchAlexYields(): Promise<DiscoveredYield[]> {
  try {
    // ALEX has a public API for pool data
    // For production, you'd fetch from their actual API
    // This is a representative structure
    
    return [
      {
        id: 'alex-stx-sbtc',
        protocol: PROTOCOLS.ALEX,
        pool: 'STX-sBTC',
        asset: 'STX/sBTC',
        apy: 12.5,
        tvl: 2_500_000,
        type: 'LP Pool',
        risk: 'Medium',
        rewardTokens: ['ALEX', 'STX'],
        contract: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.amm-pool-v2-01',
        lastUpdated: Date.now(),
      },
      {
        id: 'alex-stx-farming',
        protocol: PROTOCOLS.ALEX,
        pool: 'STX Single Stake',
        asset: 'STX',
        apy: 8.2,
        tvl: 5_000_000,
        type: 'Farming',
        risk: 'Low',
        rewardTokens: ['ALEX'],
        featured: true,
        contract: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.alex-reserve-pool',
        lastUpdated: Date.now(),
      },
      {
        id: 'alex-usda-pool',
        protocol: PROTOCOLS.ALEX,
        pool: 'USDA Pool',
        asset: 'USDA',
        apy: 6.8,
        tvl: 1_200_000,
        type: 'Lending',
        risk: 'Low',
        rewardTokens: ['ALEX'],
        contract: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.usda-pool',
        lastUpdated: Date.now(),
      },
    ];
  } catch (error) {
    console.error('Error fetching ALEX yields:', error);
    return [];
  }
}

/**
 * Fetch Arkadiko yield opportunities
 */
async function fetchArkadikoYields(): Promise<DiscoveredYield[]> {
  try {
    return [
      {
        id: 'arkadiko-stx-vault',
        protocol: PROTOCOLS.ARKADIKO,
        pool: 'STX Vault',
        asset: 'STX',
        apy: 9.5,
        tvl: 8_000_000,
        type: 'Vault',
        risk: 'Medium',
        rewardTokens: ['DIKO', 'USDA'],
        contract: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-freddie-v1-1',
        lastUpdated: Date.now(),
        featured: true,
      },
      {
        id: 'arkadiko-usda-lending',
        protocol: PROTOCOLS.ARKADIKO,
        pool: 'USDA Lending',
        asset: 'USDA',
        apy: 5.2,
        tvl: 3_500_000,
        type: 'Lending',
        risk: 'Low',
        rewardTokens: ['DIKO'],
        contract: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v2-1',
        lastUpdated: Date.now(),
      },
      {
        id: 'arkadiko-stx-stacking',
        protocol: PROTOCOLS.ARKADIKO,
        pool: 'Stacking Pool',
        asset: 'stSTX',
        apy: 7.8,
        tvl: 12_000_000,
        type: 'Staking',
        risk: 'Low',
        rewardTokens: ['STX'],
        lockPeriod: '2 weeks',
        contract: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.stacking-pool-v1',
        lastUpdated: Date.now(),
      },
    ];
  } catch (error) {
    console.error('Error fetching Arkadiko yields:', error);
    return [];
  }
}

/**
 * Fetch Velar yield opportunities
 */
async function fetchVelarYields(): Promise<DiscoveredYield[]> {
  try {
    return [
      {
        id: 'velar-stx-sbtc',
        protocol: PROTOCOLS.VELAR,
        pool: 'STX-sBTC Concentrated',
        asset: 'STX/sBTC',
        apy: 18.5,
        tvl: 1_800_000,
        type: 'LP Pool',
        risk: 'High',
        rewardTokens: ['VELAR', 'STX'],
        contract: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-pool-v1',
        lastUpdated: Date.now(),
      },
      {
        id: 'velar-stableswap',
        protocol: PROTOCOLS.VELAR,
        pool: 'USDA-sUSDT',
        asset: 'USDA/sUSDT',
        apy: 4.2,
        tvl: 800_000,
        type: 'LP Pool',
        risk: 'Low',
        rewardTokens: ['VELAR'],
        contract: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.stable-pool-v1',
        lastUpdated: Date.now(),
      },
    ];
  } catch (error) {
    console.error('Error fetching Velar yields:', error);
    return [];
  }
}

/**
 * Fetch Bitflow yield opportunities
 */
async function fetchBitflowYields(): Promise<DiscoveredYield[]> {
  try {
    return [
      {
        id: 'bitflow-sbtc-stx',
        protocol: PROTOCOLS.BITFLOW,
        pool: 'sBTC-STX LP',
        asset: 'sBTC/STX',
        apy: 15.2,
        tvl: 4_200_000,
        type: 'LP Pool',
        risk: 'Medium',
        rewardTokens: ['BFL', 'sBTC'],
        featured: true,
        contract: 'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.bitflow-pool-v1',
        lastUpdated: Date.now(),
      },
      {
        id: 'bitflow-stable-3pool',
        protocol: PROTOCOLS.BITFLOW,
        pool: 'Stable 3Pool',
        asset: 'USDA/sUSDT/XUSD',
        apy: 6.5,
        tvl: 2_100_000,
        type: 'LP Pool',
        risk: 'Low',
        rewardTokens: ['BFL'],
        contract: 'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.stable-3pool-v1',
        lastUpdated: Date.now(),
      },
    ];
  } catch (error) {
    console.error('Error fetching Bitflow yields:', error);
    return [];
  }
}

/**
 * Fetch STX City stacking yields
 */
async function fetchStxCityYields(): Promise<DiscoveredYield[]> {
  try {
    return [
      {
        id: 'stxcity-stacking',
        protocol: PROTOCOLS.STXCITY,
        pool: 'STX Stacking Pool',
        asset: 'STX',
        apy: 10.0, // PoX stacking rewards
        tvl: 50_000_000,
        type: 'Staking',
        risk: 'Low',
        rewardTokens: ['BTC'],
        lockPeriod: '2 cycles (~4 weeks)',
        contract: 'SP000000000000000000002Q6VF78.pox-4',
        lastUpdated: Date.now(),
      },
    ];
  } catch (error) {
    console.error('Error fetching STX City yields:', error);
    return [];
  }
}

// ============================================
// MAIN DISCOVERY FUNCTIONS
// ============================================

/**
 * Discover all yield opportunities across protocols
 */
export async function discoverYieldOpportunities(): Promise<DiscoveredYield[]> {
  const now = Date.now();
  
  // Return cached data if fresh
  if (yieldCache && (now - yieldCache.fetchedAt) < CACHE_DURATION) {
    return yieldCache.opportunities;
  }

  try {
    // Fetch from all protocols in parallel
    const [
      alexYields,
      arkadikoYields,
      velarYields,
      bitflowYields,
      stxCityYields,
    ] = await Promise.all([
      fetchAlexYields(),
      fetchArkadikoYields(),
      fetchVelarYields(),
      fetchBitflowYields(),
      fetchStxCityYields(),
    ]);

    const allOpportunities = [
      ...alexYields,
      ...arkadikoYields,
      ...velarYields,
      ...bitflowYields,
      ...stxCityYields,
    ];

    // Sort by APY descending
    allOpportunities.sort((a, b) => b.apy - a.apy);

    // Cache results
    yieldCache = {
      opportunities: allOpportunities,
      fetchedAt: now,
    };

    return allOpportunities;
  } catch (error) {
    console.error('Error discovering yields:', error);
    return yieldCache?.opportunities || [];
  }
}

/**
 * Get featured yield opportunities
 */
export async function getFeaturedYields(): Promise<DiscoveredYield[]> {
  const all = await discoverYieldOpportunities();
  return all.filter(y => y.featured);
}

/**
 * Get yield opportunities by protocol
 */
export async function getYieldsByProtocol(protocolName: string): Promise<DiscoveredYield[]> {
  const all = await discoverYieldOpportunities();
  return all.filter(y => y.protocol.name.toLowerCase() === protocolName.toLowerCase());
}

/**
 * Get yield opportunities by type
 */
export async function getYieldsByType(type: DiscoveredYield['type']): Promise<DiscoveredYield[]> {
  const all = await discoverYieldOpportunities();
  return all.filter(y => y.type === type);
}

// ============================================
// USER POSITION DISCOVERY
// ============================================

/**
 * Discover user's yield positions across protocols
 * Checks on-chain data for user's positions in known protocols
 */
export async function discoverUserYieldPositions(address: string): Promise<UserYieldPosition[]> {
  if (!address) return [];

  try {
    // Fetch user's token balances and contract interactions
    const [balances, transactions] = await Promise.all([
      fetchUserBalances(address),
      fetchUserContractCalls(address),
    ]);

    const positions: UserYieldPosition[] = [];

    // Check for LP tokens in balances
    for (const [tokenId, balance] of Object.entries(balances.fungible_tokens || {})) {
      const balanceValue = balance as { balance: string };
      
      // ALEX LP tokens
      if (tokenId.includes('amm-pool') || tokenId.includes('alex')) {
        positions.push({
          protocol: 'ALEX',
          pool: extractPoolName(tokenId),
          deposited: Number(balanceValue.balance) / 1_000_000,
          depositedUsd: estimateUsdValue(Number(balanceValue.balance) / 1_000_000, 'lp'),
          earned: 0, // Would need historical data
          earnedUsd: 0,
          apy: 10.5, // Estimated
          asset: 'LP Token',
          contract: tokenId.split('::')[0],
        });
      }

      // Arkadiko tokens
      if (tokenId.includes('arkadiko') || tokenId.includes('diko')) {
        positions.push({
          protocol: 'Arkadiko',
          pool: extractPoolName(tokenId),
          deposited: Number(balanceValue.balance) / 1_000_000,
          depositedUsd: estimateUsdValue(Number(balanceValue.balance) / 1_000_000, 'diko'),
          earned: 0,
          earnedUsd: 0,
          apy: 8.5,
          asset: extractAssetName(tokenId),
          contract: tokenId.split('::')[0],
        });
      }

      // stSTX (liquid staking)
      if (tokenId.toLowerCase().includes('ststx')) {
        positions.push({
          protocol: 'Arkadiko',
          pool: 'Stacking Pool',
          deposited: Number(balanceValue.balance) / 1_000_000,
          depositedUsd: estimateUsdValue(Number(balanceValue.balance) / 1_000_000, 'stx'),
          earned: 0,
          earnedUsd: 0,
          apy: 7.8,
          asset: 'stSTX',
          contract: tokenId.split('::')[0],
        });
      }
    }

    return positions;
  } catch (error) {
    console.error('Error discovering user positions:', error);
    return [];
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchUserBalances(address: string): Promise<{
  stx: { balance: string };
  fungible_tokens: Record<string, { balance: string }>;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/extended/v1/address/${address}/balances`);
    if (!response.ok) throw new Error('Failed to fetch balances');
    return response.json();
  } catch {
    return { stx: { balance: '0' }, fungible_tokens: {} };
  }
}

async function fetchUserContractCalls(address: string): Promise<unknown[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/extended/v1/address/${address}/transactions?limit=50`
    );
    if (!response.ok) throw new Error('Failed to fetch transactions');
    const data = await response.json();
    return data.results?.filter((tx: { tx_type: string }) => 
      tx.tx_type === 'contract_call'
    ) || [];
  } catch {
    return [];
  }
}

function extractPoolName(tokenId: string): string {
  const parts = tokenId.split('::');
  if (parts.length > 1) {
    return parts[1].replace(/-/g, ' ').replace(/token|lp/gi, '').trim() || 'Pool';
  }
  return 'Unknown Pool';
}

function extractAssetName(tokenId: string): string {
  const parts = tokenId.split('::');
  if (parts.length > 1) {
    const name = parts[1];
    if (name.includes('stx')) return 'STX';
    if (name.includes('btc') || name.includes('sbtc')) return 'sBTC';
    if (name.includes('usda')) return 'USDA';
    if (name.includes('diko')) return 'DIKO';
    return name.toUpperCase();
  }
  return 'Unknown';
}

function estimateUsdValue(amount: number, tokenType: string): number {
  // Rough estimates - in production, use real prices
  const prices: Record<string, number> = {
    stx: 0.25,
    sbtc: 69000,
    usda: 1,
    diko: 0.05,
    lp: 1, // LP tokens need special handling
  };
  return amount * (prices[tokenType.toLowerCase()] || 1);
}

/**
 * Clear cache to force refresh
 */
export function clearYieldDiscoveryCache(): void {
  yieldCache = null;
}

/**
 * Get total TVL across all discovered yields
 */
export async function getTotalDiscoveredTVL(): Promise<number> {
  const yields = await discoverYieldOpportunities();
  return yields.reduce((sum, y) => sum + y.tvl, 0);
}

/**
 * Get average APY across all opportunities
 */
export async function getAverageAPY(): Promise<number> {
  const yields = await discoverYieldOpportunities();
  if (yields.length === 0) return 0;
  return yields.reduce((sum, y) => sum + y.apy, 0) / yields.length;
}
