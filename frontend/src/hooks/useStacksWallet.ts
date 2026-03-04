/**
 * StackRadar Wallet Hook
 * 
 * Real Stacks wallet connection using @stacks/connect
 * @see https://docs.stacks.co/stacks.js/connect-web-app
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import React from 'react';
import { connect, disconnect as disconnectWallet, isConnected, getLocalStorage } from '@stacks/connect';
import { NETWORK, API_BASE_URL } from '@/lib/stacks/contracts';

// ============================================
// CONSTANTS
// ============================================

export const TESTNET_FAUCET_URL = 'https://explorer.hiro.so/sandbox/faucet?chain=testnet';
export const TESTNET_EXPLORER_URL = 'https://explorer.hiro.so';

// sBTC contract on testnet (official testnet sBTC)
export const SBTC_CONTRACT = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token';

// ============================================
// TYPES
// ============================================

interface WalletState {
  connected: boolean;
  address: string;
  isLoading: boolean;
  error: string | null;
  stxBalance: bigint;
  sbtcBalance: bigint;
  balancesLoading: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isTestnet: boolean;
  stxBalanceFormatted: string;
  sbtcBalanceFormatted: string;
  faucetUrl: string;
  refreshBalances: () => Promise<void>;
  getExplorerTxUrl: (txId: string) => string;
  getExplorerAddressUrl: (address: string) => string;
}

// ============================================
// CONTEXT
// ============================================

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: '',
  isLoading: false,
  error: null,
  stxBalance: BigInt(0),
  sbtcBalance: BigInt(0),
  balancesLoading: false,
  connect: async () => {},
  disconnect: () => {},
  isTestnet: true,
  stxBalanceFormatted: '0.00',
  sbtcBalanceFormatted: '0.00000000',
  faucetUrl: TESTNET_FAUCET_URL,
  refreshBalances: async () => {},
  getExplorerTxUrl: () => '',
  getExplorerAddressUrl: () => '',
});

// ============================================
// BALANCE FETCHING
// ============================================

interface BalanceResponse {
  stx: {
    balance: string;
    total_sent: string;
    total_received: string;
  };
  fungible_tokens: {
    [key: string]: {
      balance: string;
      total_sent: string;
      total_received: string;
    };
  };
}

async function fetchBalances(address: string): Promise<{ stx: bigint; sbtc: bigint }> {
  try {
    const response = await fetch(`${API_BASE_URL}/extended/v1/address/${address}/balances`);
    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.status}`);
    }
    
    const data: BalanceResponse = await response.json();
    
    // STX balance is in microSTX (1 STX = 1,000,000 microSTX)
    const stxBalance = BigInt(data.stx?.balance || '0');
    
    // sBTC balance - look for the sBTC token in fungible_tokens
    // The key format is "{contract_address}.{contract_name}::{token_name}"
    let sbtcBalance = BigInt(0);
    for (const [key, value] of Object.entries(data.fungible_tokens || {})) {
      if (key.toLowerCase().includes('sbtc')) {
        sbtcBalance = BigInt(value.balance || '0');
        break;
      }
    }
    
    return { stx: stxBalance, sbtc: sbtcBalance };
  } catch (error) {
    console.error('Error fetching balances:', error);
    return { stx: BigInt(0), sbtc: BigInt(0) };
  }
}

// ============================================
// PROVIDER
// ============================================

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: '',
    isLoading: false,
    error: null,
    stxBalance: BigInt(0),
    sbtcBalance: BigInt(0),
    balancesLoading: false,
  });
  
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch balances for an address
  const refreshBalances = useCallback(async () => {
    if (!state.address) return;
    
    setState(prev => ({ ...prev, balancesLoading: true }));
    
    const { stx, sbtc } = await fetchBalances(state.address);
    
    setState(prev => ({
      ...prev,
      stxBalance: stx,
      sbtcBalance: sbtc,
      balancesLoading: false,
    }));
  }, [state.address]);

  // Poll balances every 30 seconds when connected
  useEffect(() => {
    if (state.connected && state.address) {
      // Initial fetch
      refreshBalances();
      
      // Set up polling
      balanceIntervalRef.current = setInterval(refreshBalances, 30000);
      
      return () => {
        if (balanceIntervalRef.current) {
          clearInterval(balanceIntervalRef.current);
        }
      };
    }
  }, [state.connected, state.address, refreshBalances]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (isConnected()) {
          // Get stored addresses from localStorage
          const stored = getLocalStorage();
          if (stored?.addresses) {
            // Per Stacks convention: addresses[2] is testnet STX address
            // [0]=mainnetSTX, [1]=mainnetBTC, [2]=testnetSTX, [3]=testnetBTC
            const testnetAddress = stored.addresses[2]?.address;
            
            if (testnetAddress) {
              setState(prev => ({
                ...prev,
                connected: true,
                address: testnetAddress,
                isLoading: false,
                error: null,
              }));
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };
    
    checkConnection();
  }, []);

  const handleConnect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Per Stacks docs: connect() initiates wallet connection and stores addresses
      // response.addresses contains [mainnetSTX, mainnetBTC, testnetSTX, testnetBTC]
      const response = await connect();

      console.log('Wallet connect response:', response);

      // Per Stacks convention: addresses[2] is the testnet STX address
      const testnetAddress = response.addresses[2]?.address;
      
      if (!testnetAddress) {
        throw new Error('No testnet address found. Please use a wallet that supports Stacks testnet.');
      }

      setState(prev => ({
        ...prev,
        connected: true,
        address: testnetAddress,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Wallet connection error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    try {
      disconnectWallet();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
    
    // Clear balance polling
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
    }
    
    setState({
      connected: false,
      address: '',
      isLoading: false,
      error: null,
      stxBalance: BigInt(0),
      sbtcBalance: BigInt(0),
      balancesLoading: false,
    });
  }, []);

  // Format STX balance (6 decimals)
  const stxBalanceFormatted = (Number(state.stxBalance) / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  // Format sBTC balance (8 decimals)
  const sbtcBalanceFormatted = (Number(state.sbtcBalance) / 100_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

  // Explorer URL helpers
  const getExplorerTxUrl = useCallback((txId: string) => {
    const cleanTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
    return `${TESTNET_EXPLORER_URL}/txid/${cleanTxId}?chain=testnet`;
  }, []);

  const getExplorerAddressUrl = useCallback((address: string) => {
    return `${TESTNET_EXPLORER_URL}/address/${address}?chain=testnet`;
  }, []);

  const value: WalletContextType = {
    ...state,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isTestnet: NETWORK === 'testnet',
    stxBalanceFormatted,
    sbtcBalanceFormatted,
    faucetUrl: TESTNET_FAUCET_URL,
    refreshBalances,
    getExplorerTxUrl,
    getExplorerAddressUrl,
  };

  return React.createElement(
    WalletContext.Provider,
    { value },
    children
  );
}

// ============================================
// HOOK
// ============================================

export function useWallet() {
  return useContext(WalletContext);
}

/**
 * Hook that throws if wallet is not connected
 * Useful for components that require authentication
 */
export function useRequiredWallet() {
  const wallet = useWallet();
  
  if (!wallet.connected) {
    throw new Error('Wallet connection required');
  }
  
  return wallet as WalletContextType & { connected: true; address: string };
}

/**
 * Format address for display (truncated)
 */
export function formatAddress(address: string, start = 4, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Check if address is testnet
 */
export function isTestnetAddress(address: string): boolean {
  return address.startsWith('ST');
}

/**
 * Check if address is mainnet
 */
export function isMainnetAddress(address: string): boolean {
  return address.startsWith('SP');
}
