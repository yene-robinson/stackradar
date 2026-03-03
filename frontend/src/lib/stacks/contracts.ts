/**
 * StackRadar Contract Configuration
 * 
 * Deployed contract addresses and configuration for testnet
 * @see https://docs.stacks.co/stacks.js/network-configuration
 */

// Contract deployer address on testnet
export const DEPLOYER_ADDRESS = 'ST1BQ60GADTBRMPX2M7GE88QJ4Z0G22Y14H6GE66X';

// Contract names
export const PORTFOLIO_TRACKER_NAME = 'portfolio-tracker';
export const YIELD_AGGREGATOR_NAME = 'yield-aggregator';

// Full contract principals
export const CONTRACTS = {
  portfolioTracker: {
    address: DEPLOYER_ADDRESS,
    name: PORTFOLIO_TRACKER_NAME,
    principal: `${DEPLOYER_ADDRESS}.${PORTFOLIO_TRACKER_NAME}`,
  },
  yieldAggregator: {
    address: DEPLOYER_ADDRESS,
    name: YIELD_AGGREGATOR_NAME,
    principal: `${DEPLOYER_ADDRESS}.${YIELD_AGGREGATOR_NAME}`,
  },
} as const;

// Position types enum matching Clarity contract
export const POSITION_TYPES = {
  STAKING: 1,
  LENDING: 2,
  LP: 3,
  VAULT: 4,
} as const;

// Position type labels
export const POSITION_TYPE_LABELS: Record<number, string> = {
  1: 'Staking',
  2: 'Lending',
  3: 'LP Pool',
  4: 'Vault',
};

// Error codes from contracts
export const ERROR_CODES = {
  // Portfolio Tracker errors
  ERR_NOT_OWNER: 1000,
  ERR_NOT_FOUND: 1001,
  ERR_INVALID_AMOUNT: 1002,
  ERR_INVALID_PROTOCOL: 1003,
  ERR_ALREADY_EXISTS: 1004,
  ERR_NOT_REGISTERED: 1005,
  ERR_PROTOCOL_INACTIVE: 1006,
  ERR_INVALID_TYPE: 1007,
  
  // Yield Aggregator errors
  ERR_YA_NOT_FOUND: 2001,
  ERR_YA_EXCEEDS_MAX: 2002,
  ERR_YA_ALREADY_EXISTS: 2003,
  ERR_YA_NOT_ACTIVE: 2004,
  ERR_YA_NOT_TRACKING: 2005,
  ERR_YA_ALREADY_TRACKING: 2006,
  ERR_YA_BELOW_MIN: 2007,
} as const;

// Human-readable error messages
export const ERROR_MESSAGES: Record<number, string> = {
  1000: 'Not authorized - owner only',
  1001: 'Position not found',
  1002: 'Invalid amount',
  1003: 'Invalid protocol',
  1004: 'Already exists',
  1005: 'User not registered',
  1006: 'Protocol is inactive',
  1007: 'Invalid position type',
  2001: 'Yield source not found',
  2002: 'APY exceeds maximum',
  2003: 'Yield source already exists',
  2004: 'Yield source not active',
  2005: 'Not tracking this source',
  2006: 'Already tracking this source',
  2007: 'Amount below minimum deposit',
};

// Network configuration
export const NETWORK = 'testnet' as const;
export const API_BASE_URL = 'https://api.testnet.hiro.so';
