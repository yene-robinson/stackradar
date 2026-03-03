/**
 * StackRadar Wallet Hook
 * 
 * Real Stacks wallet connection using @stacks/connect
 * @see https://docs.stacks.co/stacks.js/connect-web-app
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import React from 'react';
import { connect, disconnect as disconnectWallet, isConnected, getLocalStorage } from '@stacks/connect';
import { NETWORK } from '@/lib/stacks/contracts';

// ============================================
// TYPES
// ============================================

interface WalletState {
  connected: boolean;
  address: string;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isTestnet: boolean;
}

// ============================================
// CONTEXT
// ============================================

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: '',
  isLoading: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  isTestnet: true,
});

// ============================================
// PROVIDER
// ============================================

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: '',
    isLoading: false,
    error: null,
  });

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
              setState({
                connected: true,
                address: testnetAddress,
                isLoading: false,
                error: null,
              });
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

      setState({
        connected: true,
        address: testnetAddress,
        isLoading: false,
        error: null,
      });
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
    
    setState({
      connected: false,
      address: '',
      isLoading: false,
      error: null,
    });
  }, []);

  const value: WalletContextType = {
    ...state,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isTestnet: NETWORK === 'testnet',
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
