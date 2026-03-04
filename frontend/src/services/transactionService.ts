/**
 * StackRadar Transaction Service
 * 
 * Fetches real transaction history from Hiro API
 * @see https://docs.hiro.so/stacks/api
 */

import { API_BASE_URL } from '@/lib/stacks/contracts';
import { TESTNET_EXPLORER_URL } from '@/hooks/useStacksWallet';

// ============================================
// TYPES
// ============================================

export type TransactionType = 'deposit' | 'withdraw' | 'yield' | 'swap' | 'contract_call' | 'token_transfer' | 'coinbase';

export interface Transaction {
  id: string;
  txId: string;
  type: TransactionType;
  status: 'success' | 'pending' | 'failed';
  sender: string;
  recipient?: string;
  amount: number;
  asset: string;
  fee: number;
  blockHeight?: number;
  blockTime?: number;
  date: string;
  explorerUrl: string;
  contractCall?: {
    contractId: string;
    functionName: string;
    functionArgs: string[];
  };
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

// Raw API types from Hiro
interface HiroTxEvent {
  event_type: string;
  asset?: {
    asset_id: string;
    amount: string;
  };
}

interface HiroTransaction {
  tx_id: string;
  tx_type: 'token_transfer' | 'contract_call' | 'smart_contract' | 'coinbase' | 'poison_microblock' | 'tenure_change';
  tx_status: string;
  sender_address: string;
  fee_rate: string;
  block_height?: number;
  block_time?: number;
  block_time_iso?: string;
  burn_block_time?: number;
  burn_block_time_iso?: string;
  token_transfer?: {
    recipient_address: string;
    amount: string;
    memo?: string;
  };
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_args?: Array<{
      repr: string;
      name?: string;
    }>;
  };
  events?: HiroTxEvent[];
}

interface HiroTransactionsResponse {
  results: HiroTransaction[];
  total: number;
  offset: number;
  limit: number;
}

// ============================================
// HELPERS
// ============================================

/**
 * Maps Hiro transaction to our Transaction type
 */
function mapTransaction(tx: HiroTransaction): Transaction {
  const type = inferTransactionType(tx);
  const { amount, asset } = extractAmountAndAsset(tx);
  const date = tx.block_time_iso || tx.burn_block_time_iso || new Date().toISOString();
  
  return {
    id: tx.tx_id,
    txId: tx.tx_id,
    type,
    status: mapStatus(tx.tx_status),
    sender: tx.sender_address,
    recipient: tx.token_transfer?.recipient_address,
    amount,
    asset,
    fee: Number(tx.fee_rate) / 1_000_000, // Convert from microSTX
    blockHeight: tx.block_height,
    blockTime: tx.block_time || tx.burn_block_time,
    date: formatDate(date),
    explorerUrl: `${TESTNET_EXPLORER_URL}/txid/${tx.tx_id}?chain=testnet`,
    contractCall: tx.contract_call ? {
      contractId: tx.contract_call.contract_id,
      functionName: tx.contract_call.function_name,
      functionArgs: tx.contract_call.function_args?.map(arg => arg.repr) || [],
    } : undefined,
  };
}

/**
 * Infer user-friendly transaction type from Hiro tx
 */
function inferTransactionType(tx: HiroTransaction): TransactionType {
  if (tx.tx_type === 'token_transfer') {
    return 'token_transfer';
  }
  
  if (tx.tx_type === 'contract_call' && tx.contract_call) {
    const fn = tx.contract_call.function_name.toLowerCase();
    const contract = tx.contract_call.contract_id.toLowerCase();
    
    // Detect deposit/withdraw/yield based on function names
    if (fn.includes('deposit') || fn.includes('add-position') || fn.includes('stake') || fn.includes('supply')) {
      return 'deposit';
    }
    if (fn.includes('withdraw') || fn.includes('remove') || fn.includes('unstake') || fn.includes('redeem')) {
      return 'withdraw';
    }
    if (fn.includes('claim') || fn.includes('harvest') || fn.includes('reward')) {
      return 'yield';
    }
    if (fn.includes('swap') || fn.includes('exchange') || fn.includes('trade')) {
      return 'swap';
    }
    
    // Check for sBTC-related contracts
    if (contract.includes('sbtc')) {
      if (fn.includes('mint') || fn.includes('peg-in')) {
        return 'deposit';
      }
      if (fn.includes('burn') || fn.includes('peg-out')) {
        return 'withdraw';
      }
    }
    
    return 'contract_call';
  }
  
  if (tx.tx_type === 'coinbase') {
    return 'coinbase';
  }
  
  return 'contract_call';
}

/**
 * Extract amount and asset from transaction
 */
function extractAmountAndAsset(tx: HiroTransaction): { amount: number; asset: string } {
  // Token transfer
  if (tx.token_transfer) {
    return {
      amount: Number(tx.token_transfer.amount) / 1_000_000,
      asset: 'STX',
    };
  }
  
  // Check events for token transfers
  if (tx.events?.length) {
    const ftEvent = tx.events.find(e => e.event_type === 'fungible_token_asset' && e.asset);
    if (ftEvent?.asset) {
      const assetId = ftEvent.asset.asset_id;
      const asset = assetId.includes('sbtc') ? 'sBTC' : assetId.split('::').pop() || 'TOKEN';
      // sBTC has 8 decimals, others default to 6
      const decimals = asset === 'sBTC' ? 100_000_000 : 1_000_000;
      return {
        amount: Number(ftEvent.asset.amount) / decimals,
        asset,
      };
    }
    
    const stxEvent = tx.events.find(e => e.event_type === 'stx_asset');
    if (stxEvent?.asset) {
      return {
        amount: Number(stxEvent.asset.amount) / 1_000_000,
        asset: 'STX',
      };
    }
  }
  
  return { amount: 0, asset: 'STX' };
}

/**
 * Map Hiro status to our status
 */
function mapStatus(status: string): 'success' | 'pending' | 'failed' {
  if (status === 'success') return 'success';
  if (status === 'pending' || status === 'submitted') return 'pending';
  return 'failed';
}

/**
 * Format ISO date to readable format
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return mins <= 1 ? 'Just now' : `${mins}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  }
  
  // Return formatted date
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch transaction history for an address
 */
export async function getTransactionHistory(
  address: string,
  options: {
    offset?: number;
    limit?: number;
  } = {}
): Promise<TransactionHistoryResponse> {
  const { offset = 0, limit = 20 } = options;
  
  try {
    const url = new URL(`${API_BASE_URL}/extended/v1/address/${address}/transactions`);
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('limit', limit.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }
    
    const data: HiroTransactionsResponse = await response.json();
    
    return {
      transactions: data.results.map(mapTransaction),
      total: data.total,
      offset: data.offset,
      limit: data.limit,
      hasMore: data.offset + data.results.length < data.total,
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return {
      transactions: [],
      total: 0,
      offset: 0,
      limit,
      hasMore: false,
    };
  }
}

/**
 * Fetch a single transaction by ID
 */
export async function getTransaction(txId: string): Promise<Transaction | null> {
  try {
    const cleanTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
    const response = await fetch(`${API_BASE_URL}/extended/v1/tx/${cleanTxId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch transaction: ${response.status}`);
    }
    
    const data: HiroTransaction = await response.json();
    return mapTransaction(data);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

/**
 * Fetch recent contract-specific transactions
 * Useful for showing portfolio-tracker activity
 */
export async function getContractTransactions(
  contractAddress: string,
  contractName: string,
  options: {
    offset?: number;
    limit?: number;
  } = {}
): Promise<TransactionHistoryResponse> {
  const { offset = 0, limit = 20 } = options;
  
  try {
    const url = new URL(`${API_BASE_URL}/extended/v1/address/${contractAddress}.${contractName}/transactions`);
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('limit', limit.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch contract transactions: ${response.status}`);
    }
    
    const data: HiroTransactionsResponse = await response.json();
    
    return {
      transactions: data.results.map(mapTransaction),
      total: data.total,
      offset: data.offset,
      limit: data.limit,
      hasMore: data.offset + data.results.length < data.total,
    };
  } catch (error) {
    console.error('Error fetching contract transactions:', error);
    return {
      transactions: [],
      total: 0,
      offset: 0,
      limit,
      hasMore: false,
    };
  }
}

/**
 * Get pending transactions for an address
 */
export async function getPendingTransactions(address: string): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/extended/v1/tx/mempool?sender_address=${address}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pending transactions: ${response.status}`);
    }
    
    const data: HiroTransactionsResponse = await response.json();
    
    return data.results.map(tx => ({
      ...mapTransaction(tx),
      status: 'pending',
    }));
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return [];
  }
}
