/**
 * StackRadar Transaction History Hook
 * 
 * Fetches and caches transaction history from Hiro API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@/hooks/useStacksWallet';
import { 
  Transaction, 
  TransactionHistoryResponse,
  getTransactionHistory, 
  getPendingTransactions 
} from '@/services/transactionService';

interface UseTransactionHistoryOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in ms
}

interface UseTransactionHistoryResult {
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTransactionHistory(
  options: UseTransactionHistoryOptions = {}
): UseTransactionHistoryResult {
  const { limit = 10, autoRefresh = true, refreshInterval = 30000 } = options;
  const { address, connected } = useWallet();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TransactionHistoryResponse | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const offsetRef = useRef(0);

  // Fetch transactions
  const fetchTransactions = useCallback(async (reset = true) => {
    if (!address || !connected) {
      setTransactions([]);
      setPendingTransactions([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const offset = reset ? 0 : offsetRef.current;
      
      // Fetch confirmed and pending transactions in parallel
      const [historyResult, pendingResult] = await Promise.all([
        getTransactionHistory(address, { offset, limit }),
        reset ? getPendingTransactions(address) : Promise.resolve([]),
      ]);
      
      if (reset) {
        setTransactions(historyResult.transactions);
        setPendingTransactions(pendingResult);
        offsetRef.current = limit;
      } else {
        setTransactions(prev => [...prev, ...historyResult.transactions]);
        offsetRef.current += limit;
      }
      
      setResponse(historyResult);
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [address, connected, limit]);

  // Load more transactions (pagination)
  const loadMore = useCallback(async () => {
    if (loading || !response?.hasMore) return;
    await fetchTransactions(false);
  }, [loading, response?.hasMore, fetchTransactions]);

  // Refresh transactions
  const refresh = useCallback(async () => {
    await fetchTransactions(true);
  }, [fetchTransactions]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (connected && address) {
      fetchTransactions(true);
      
      // Set up auto-refresh
      if (autoRefresh) {
        intervalRef.current = setInterval(() => {
          fetchTransactions(true);
        }, refreshInterval);
      }
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setTransactions([]);
      setPendingTransactions([]);
      setResponse(null);
    }
  }, [connected, address, fetchTransactions, autoRefresh, refreshInterval]);

  return {
    transactions,
    pendingTransactions,
    loading,
    error,
    hasMore: response?.hasMore ?? false,
    total: response?.total ?? 0,
    loadMore,
    refresh,
  };
}

/**
 * Hook for watching a specific transaction
 */
export function useTransactionStatus(txId: string | null) {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!txId) {
      setStatus(null);
      return;
    }
    
    let cancelled = false;
    let pollInterval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      setLoading(true);
      try {
        const cleanTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
        const response = await fetch(
          `https://api.testnet.hiro.so/extended/v1/tx/${cleanTxId}`
        );
        
        if (cancelled) return;
        
        if (response.ok) {
          const data = await response.json();
          const txStatus = data.tx_status;
          
          if (txStatus === 'success') {
            setStatus('success');
            clearInterval(pollInterval);
          } else if (txStatus === 'abort_by_response' || txStatus === 'abort_by_post_condition') {
            setStatus('failed');
            clearInterval(pollInterval);
          } else {
            setStatus('pending');
          }
        } else if (response.status === 404) {
          // Transaction not found yet - likely still in mempool
          setStatus('pending');
        }
      } catch (err) {
        console.error('Error checking transaction status:', err);
        setStatus('pending');
      } finally {
        setLoading(false);
      }
    };
    
    // Check immediately
    checkStatus();
    
    // Poll every 5 seconds while pending
    pollInterval = setInterval(checkStatus, 5000);
    
    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [txId]);
  
  return { status, loading };
}
