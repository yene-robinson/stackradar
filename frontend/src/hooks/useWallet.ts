import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import React from 'react';

interface WalletContextType {
  connected: boolean;
  address: string;
  connect: (address?: string) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: '',
  connect: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');

  const connect = useCallback((addr: string = 'SP3K8V0RZBGFRZNH3SKPAQY0NQFH5QVB4Y8X2Q') => {
    setConnected(true);
    setAddress(addr);
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress('');
  }, []);

  return React.createElement(
    WalletContext.Provider,
    { value: { connected, address, connect, disconnect } },
    children
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
