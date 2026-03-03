/**
 * StackRadar Contract Write Functions
 * 
 * Functions for writing to contracts using @stacks/connect
 * @see https://docs.stacks.co/stacks.js/signing-transactions
 */

import { request } from '@stacks/connect';
import { Cl, ClarityValue } from '@stacks/transactions';
import { CONTRACTS, NETWORK, POSITION_TYPES } from './contracts';

// ============================================
// TYPES
// ============================================

export interface TransactionResult {
  txId: string;
  success: boolean;
}

export interface AddPositionParams {
  protocolId: number;
  positionType: keyof typeof POSITION_TYPES;
  amount: number;
  entryValue: number;
}

export interface UpdatePositionParams {
  positionId: number;
  newAmount: number;
  newValue: number;
}

export interface StartTrackingParams {
  sourceId: number;
  amount: number;
}

export interface RegisterProtocolParams {
  name: string;
  contractAddress: string;
}

export interface RegisterYieldSourceParams {
  name: string;
  sourceType: number;
  contractAddress: string;
  initialApy: number;
  minDeposit: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Execute a contract call via wallet
 */
async function callContract(
  contractPrincipal: string,
  functionName: string,
  functionArgs: ClarityValue[],
): Promise<TransactionResult> {
  try {
    const response = await request('stx_callContract', {
      contract: contractPrincipal as `${string}.${string}`,
      functionName,
      functionArgs,
      network: NETWORK,
    });

    return {
      txId: response.txid,
      success: true,
    };
  } catch (error) {
    console.error(`Error calling ${contractPrincipal}.${functionName}:`, error);
    throw error;
  }
}

// ============================================
// PORTFOLIO TRACKER WRITE FUNCTIONS
// ============================================

/**
 * Register a new user
 */
export async function registerUser(): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'register-user',
    []
  );
}

/**
 * Add a new position to the portfolio
 */
export async function addPosition(params: AddPositionParams): Promise<TransactionResult> {
  const positionTypeId = POSITION_TYPES[params.positionType];
  
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'add-position',
    [
      Cl.uint(params.protocolId),
      Cl.uint(positionTypeId),
      Cl.uint(params.amount),
      Cl.uint(params.entryValue),
    ]
  );
}

/**
 * Update an existing position's value
 */
export async function updatePositionValue(params: UpdatePositionParams): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'update-position-value',
    [
      Cl.uint(params.positionId),
      Cl.uint(params.newAmount),
      Cl.uint(params.newValue),
    ]
  );
}

/**
 * Close a position
 */
export async function closePosition(positionId: number): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'close-position',
    [Cl.uint(positionId)]
  );
}

/**
 * Reopen a closed position
 */
export async function reopenPosition(positionId: number): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'reopen-position',
    [Cl.uint(positionId)]
  );
}

/**
 * Record a portfolio snapshot
 */
export async function recordSnapshot(): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'record-snapshot',
    []
  );
}

/**
 * Register a new protocol (owner only)
 */
export async function registerProtocol(params: RegisterProtocolParams): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'register-protocol',
    [
      Cl.stringAscii(params.name),
      Cl.principal(params.contractAddress),
    ]
  );
}

/**
 * Set protocol active status (owner only)
 */
export async function setProtocolActive(protocolId: number, isActive: boolean): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.portfolioTracker.principal,
    'set-protocol-active',
    [
      Cl.uint(protocolId),
      Cl.bool(isActive),
    ]
  );
}

// ============================================
// YIELD AGGREGATOR WRITE FUNCTIONS
// ============================================

/**
 * Register a new yield source (owner only)
 */
export async function registerYieldSource(params: RegisterYieldSourceParams): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'register-yield-source',
    [
      Cl.stringAscii(params.name),
      Cl.uint(params.sourceType),
      Cl.principal(params.contractAddress),
      Cl.uint(params.initialApy),
      Cl.uint(params.minDeposit),
    ]
  );
}

/**
 * Start tracking a yield source
 */
export async function startTracking(params: StartTrackingParams): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'start-tracking',
    [
      Cl.uint(params.sourceId),
      Cl.uint(params.amount),
    ]
  );
}

/**
 * Stop tracking a yield source
 */
export async function stopTracking(sourceId: number): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'stop-tracking',
    [Cl.uint(sourceId)]
  );
}

/**
 * Claim yield from a source
 */
export async function claimYield(sourceId: number): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'claim-yield',
    [Cl.uint(sourceId)]
  );
}

/**
 * Claim all pending yield from all sources
 */
export async function claimAllYield(): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'claim-all-yield',
    []
  );
}

/**
 * Update APY rate for a source (oracle only)
 */
export async function updateApy(sourceId: number, newApy: number): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'update-apy',
    [
      Cl.uint(sourceId),
      Cl.uint(newApy),
    ]
  );
}

/**
 * Update TVL for a source (oracle only)
 */
export async function updateTvl(sourceId: number, newTvl: number): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'update-tvl',
    [
      Cl.uint(sourceId),
      Cl.uint(newTvl),
    ]
  );
}

/**
 * Set source active status (owner only)
 */
export async function setSourceActive(sourceId: number, isActive: boolean): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'set-source-active',
    [
      Cl.uint(sourceId),
      Cl.bool(isActive),
    ]
  );
}

/**
 * Set oracle address (owner only)
 */
export async function setOracle(newOracle: string): Promise<TransactionResult> {
  return callContract(
    CONTRACTS.yieldAggregator.principal,
    'set-oracle',
    [Cl.principal(newOracle)]
  );
}
