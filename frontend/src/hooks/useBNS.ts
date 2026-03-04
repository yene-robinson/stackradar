/**
 * StackRadar BNS React Hooks
 * 
 * Provides hooks for BNS name resolution in React components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  resolveAddressToName,
  resolveNameToAddress,
  getNamesForAddress,
  getProfile,
  isValidBNSName,
  formatAddressWithBNS,
  BNSProfile,
} from '@/services/bnsService';

// ============================================
// ADDRESS TO NAME HOOK
// ============================================

/**
 * Resolve an address to its BNS name
 */
export function useBNSName(address: string | null | undefined) {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    resolveAddressToName(address)
      .then((result) => {
        if (!cancelled) {
          setName(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  // Display name: BNS name or truncated address
  const displayName = name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  return {
    name,
    displayName,
    hasName: !!name,
    loading,
    error,
  };
}

// ============================================
// NAME TO ADDRESS HOOK
// ============================================

/**
 * Resolve a BNS name to an address
 */
export function useBNSAddress(name: string | null | undefined) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!name) {
      setAddress(null);
      setIsValid(false);
      return;
    }

    // Check if it's a valid BNS name format
    if (!isValidBNSName(name)) {
      setIsValid(false);
      setAddress(null);
      return;
    }

    setIsValid(true);
    let cancelled = false;
    setLoading(true);
    setError(null);

    resolveNameToAddress(name)
      .then((result) => {
        if (!cancelled) {
          setAddress(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  return {
    address,
    isValid,
    exists: !!address,
    loading,
    error,
  };
}

// ============================================
// ALL NAMES FOR ADDRESS
// ============================================

/**
 * Get all BNS names owned by an address
 */
export function useBNSNames(address: string | null | undefined) {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const result = await getNamesForAddress(address);
      setNames(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch names'));
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) {
      setNames([]);
      return;
    }

    refetch();
  }, [address, refetch]);

  return {
    names,
    primaryName: names[0] || null,
    count: names.length,
    loading,
    error,
    refetch,
  };
}

// ============================================
// PROFILE HOOK
// ============================================

/**
 * Get BNS profile data for an address or name
 */
export function useBNSProfile(addressOrName: string | null | undefined) {
  const [profile, setProfile] = useState<BNSProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!addressOrName) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getProfile(addressOrName)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [addressOrName]);

  return {
    profile,
    name: profile?.name || null,
    avatar: profile?.avatar || null,
    loading,
    error,
  };
}

// ============================================
// FORMATTED ADDRESS HOOK
// ============================================

/**
 * Get a formatted display string for an address
 * Shows BNS name if available, otherwise truncated address
 */
export function useFormattedAddress(
  address: string | null | undefined,
  options?: { truncate?: boolean }
) {
  const [formatted, setFormatted] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setFormatted('');
      return;
    }

    // Set initial truncated address
    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    setFormatted(truncated);
    setLoading(true);

    formatAddressWithBNS(address, options?.truncate ?? true)
      .then(setFormatted)
      .finally(() => setLoading(false));
  }, [address, options?.truncate]);

  return {
    formatted,
    loading,
  };
}

// ============================================
// NAME INPUT HOOK
// ============================================

/**
 * Hook for handling BNS name input with validation
 */
export function useBNSInput() {
  const [input, setInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced resolution
  useEffect(() => {
    if (!input) {
      setResolvedAddress(null);
      setError(null);
      return;
    }

    // Check if it's already an address
    if (input.startsWith('S') && input.length >= 30) {
      setResolvedAddress(input);
      setError(null);
      return;
    }

    // Check if it looks like a BNS name
    if (!input.includes('.')) {
      setError(null);
      setResolvedAddress(null);
      return;
    }

    // Validate BNS name format
    if (!isValidBNSName(input)) {
      setError('Invalid BNS name format');
      setResolvedAddress(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const address = await resolveNameToAddress(input);
        if (address) {
          setResolvedAddress(address);
        } else {
          setError('Name not found');
          setResolvedAddress(null);
        }
      } catch {
        setError('Failed to resolve name');
        setResolvedAddress(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [input]);

  const reset = useCallback(() => {
    setInput('');
    setResolvedAddress(null);
    setError(null);
  }, []);

  return {
    input,
    setInput,
    resolvedAddress,
    loading,
    error,
    isValid: !!resolvedAddress,
    reset,
  };
}
