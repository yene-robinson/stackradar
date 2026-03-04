/**
 * StackRadar Price Service
 * 
 * Fetches real-time STX and sBTC prices from multiple sources
 * Primary: CoinGecko API (free tier)
 * Fallback: Cached prices with staleness indicator
 */

// ============================================
// TYPES
// ============================================

export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  last_updated: number;
}

export interface PriceData {
  stx: TokenPrice;
  btc: TokenPrice; // sBTC is 1:1 with BTC
  sbtc: TokenPrice; // Same as BTC for UI consistency
  isStale: boolean;
  lastFetched: number;
}

// ============================================
// CONSTANTS
// ============================================

// CoinGecko API (free tier, 10-30 calls/minute)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Cache duration: 60 seconds
const CACHE_DURATION = 60_000;

// Stale threshold: 5 minutes
const STALE_THRESHOLD = 300_000;

// Default fallback prices (updated periodically)
const FALLBACK_PRICES: PriceData = {
  stx: { usd: 1.25, usd_24h_change: 0, last_updated: 0 },
  btc: { usd: 65000, usd_24h_change: 0, last_updated: 0 },
  sbtc: { usd: 65000, usd_24h_change: 0, last_updated: 0 },
  isStale: true,
  lastFetched: 0,
};

// ============================================
// CACHE
// ============================================

let priceCache: PriceData | null = null;
let fetchPromise: Promise<PriceData> | null = null;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch prices from CoinGecko
 */
async function fetchFromCoinGecko(): Promise<PriceData> {
  const url = `${COINGECKO_API}/simple/price?ids=blockstack,bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  const now = Date.now();
  
  // CoinGecko uses 'blockstack' as the ID for STX
  const stxData = data.blockstack || data.stacks;
  const btcData = data.bitcoin;
  
  if (!stxData || !btcData) {
    throw new Error('Missing price data from CoinGecko');
  }
  
  return {
    stx: {
      usd: stxData.usd || 0,
      usd_24h_change: stxData.usd_24h_change || 0,
      last_updated: (stxData.last_updated_at || now / 1000) * 1000,
    },
    btc: {
      usd: btcData.usd || 0,
      usd_24h_change: btcData.usd_24h_change || 0,
      last_updated: (btcData.last_updated_at || now / 1000) * 1000,
    },
    sbtc: {
      usd: btcData.usd || 0, // sBTC is 1:1 with BTC
      usd_24h_change: btcData.usd_24h_change || 0,
      last_updated: (btcData.last_updated_at || now / 1000) * 1000,
    },
    isStale: false,
    lastFetched: now,
  };
}

/**
 * Get current prices (with caching)
 */
export async function getPrices(): Promise<PriceData> {
  const now = Date.now();
  
  // Return cached prices if fresh
  if (priceCache && (now - priceCache.lastFetched) < CACHE_DURATION) {
    return priceCache;
  }
  
  // If a fetch is already in progress, wait for it
  if (fetchPromise) {
    return fetchPromise;
  }
  
  // Start new fetch
  fetchPromise = (async () => {
    try {
      const prices = await fetchFromCoinGecko();
      priceCache = prices;
      return prices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      
      // Return cached prices if available (mark as stale)
      if (priceCache) {
        const staleCache = {
          ...priceCache,
          isStale: (now - priceCache.lastFetched) > STALE_THRESHOLD,
        };
        return staleCache;
      }
      
      // Return fallback prices
      return FALLBACK_PRICES;
    } finally {
      fetchPromise = null;
    }
  })();
  
  return fetchPromise;
}

/**
 * Get cached prices synchronously (may be stale or fallback)
 */
export function getCachedPrices(): PriceData {
  if (priceCache) {
    const now = Date.now();
    return {
      ...priceCache,
      isStale: (now - priceCache.lastFetched) > STALE_THRESHOLD,
    };
  }
  return FALLBACK_PRICES;
}

/**
 * Force refresh prices
 */
export async function refreshPrices(): Promise<PriceData> {
  priceCache = null;
  return getPrices();
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format USD price
 */
export function formatUSD(amount: number, options?: { compact?: boolean }): string {
  if (options?.compact && amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (options?.compact && amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: amount < 1 ? 4 : 2,
  }).format(amount);
}

/**
 * Format percentage change
 */
export function formatPercentChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Calculate USD value from token amount
 */
export function calculateUSDValue(
  amount: number,
  token: 'stx' | 'btc' | 'sbtc',
  prices: PriceData
): number {
  return amount * prices[token].usd;
}

/**
 * Convert between tokens using current prices
 */
export function convertTokens(
  amount: number,
  from: 'stx' | 'btc' | 'sbtc',
  to: 'stx' | 'btc' | 'sbtc',
  prices: PriceData
): number {
  if (from === to) return amount;
  
  const usdValue = amount * prices[from].usd;
  return usdValue / prices[to].usd;
}

// ============================================
// PRICE HISTORY (Mock for now - needs indexer)
// ============================================

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

/**
 * Get price history for a token
 * Note: This would need a proper price history API/indexer
 * For now, returns simulated data
 */
export async function getPriceHistory(
  token: 'stx' | 'btc' | 'sbtc',
  days: number = 30
): Promise<PriceHistoryPoint[]> {
  // Get current price as base
  const prices = await getPrices();
  const currentPrice = prices[token].usd;
  
  // Generate simulated historical data
  const points: PriceHistoryPoint[] = [];
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / 90; // 90 data points
  
  for (let i = 90; i >= 0; i--) {
    const timestamp = now - (i * interval);
    // Simulate price movement (±15% variance over period)
    const variance = 0.15;
    const randomFactor = 1 + (Math.sin(i * 0.2) * variance * 0.5) + ((Math.random() - 0.5) * variance * 0.3);
    const trendFactor = 1 + ((90 - i) / 90) * (prices[token].usd_24h_change / 100);
    
    points.push({
      timestamp,
      price: currentPrice * randomFactor * (1 / trendFactor),
    });
  }
  
  return points;
}
