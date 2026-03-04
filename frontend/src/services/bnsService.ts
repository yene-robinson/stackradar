/**
 * StackRadar BNS (Bitcoin Name System) Service
 * 
 * Resolves BNS names (.btc, .stx) to addresses and vice versa
 * Uses Hiro API for name resolution
 */

import { API_BASE_URL } from '@/lib/stacks/contracts';

// ============================================
// TYPES
// ============================================

export interface BNSName {
  name: string;
  namespace: string; // 'btc', 'stx', etc.
  fullName: string; // name.namespace
  address: string;
  zonefile?: string;
  zonefileHash?: string;
}

export interface BNSProfile {
  name: string | null;
  avatar?: string;
  bio?: string;
  twitter?: string;
  website?: string;
}

// ============================================
// CACHE
// ============================================

const nameCache = new Map<string, string>(); // address -> name
const addressCache = new Map<string, string>(); // name -> address
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  value: string | null;
  timestamp: number;
}

const profileCache = new Map<string, CacheEntry>();

// ============================================
// NAME RESOLUTION
// ============================================

/**
 * Resolve a BNS name to an address
 * Supports: name.btc, name.stx
 */
export async function resolveNameToAddress(name: string): Promise<string | null> {
  // Check cache
  const cached = addressCache.get(name.toLowerCase());
  if (cached) return cached;

  try {
    // Parse name and namespace
    const parts = name.split('.');
    if (parts.length !== 2) return null;
    
    const [localName, namespace] = parts;
    
    const response = await fetch(
      `${API_BASE_URL}/v1/names/${encodeURIComponent(name)}`
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`BNS API error: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address;

    if (address) {
      // Cache both directions
      addressCache.set(name.toLowerCase(), address);
      nameCache.set(address, name);
    }

    return address || null;
  } catch (error) {
    console.error('Error resolving BNS name:', error);
    return null;
  }
}

/**
 * Look up the primary BNS name for an address
 */
export async function resolveAddressToName(address: string): Promise<string | null> {
  // Check cache
  const cached = nameCache.get(address);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/addresses/stacks/${address}`
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`BNS API error: ${response.status}`);
    }

    const data = await response.json();
    const names = data.names || [];

    if (names.length > 0) {
      // Use the first (primary) name
      const primaryName = names[0];
      
      // Cache both directions
      nameCache.set(address, primaryName);
      addressCache.set(primaryName.toLowerCase(), address);
      
      return primaryName;
    }

    return null;
  } catch (error) {
    console.error('Error resolving address to BNS name:', error);
    return null;
  }
}

/**
 * Get all BNS names owned by an address
 */
export async function getNamesForAddress(address: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/addresses/stacks/${address}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.names || [];
  } catch (error) {
    console.error('Error fetching names for address:', error);
    return [];
  }
}

// ============================================
// PROFILE DATA
// ============================================

/**
 * Get profile data from a BNS zonefile
 */
export async function getProfile(nameOrAddress: string): Promise<BNSProfile | null> {
  // Check cache
  const cached = profileCache.get(nameOrAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value ? JSON.parse(cached.value) : null;
  }

  try {
    // Determine if it's a name or address
    const isName = nameOrAddress.includes('.');
    let name: string | null = isName ? nameOrAddress : null;
    
    if (!isName) {
      name = await resolveAddressToName(nameOrAddress);
    }

    if (!name) {
      profileCache.set(nameOrAddress, { value: null, timestamp: Date.now() });
      return null;
    }

    // Fetch name details
    const response = await fetch(
      `${API_BASE_URL}/v1/names/${encodeURIComponent(name)}`
    );

    if (!response.ok) {
      return { name };
    }

    const data = await response.json();
    
    // Parse zonefile for profile data
    const profile: BNSProfile = {
      name,
      avatar: undefined,
      bio: undefined,
      twitter: undefined,
      website: undefined,
    };

    // If zonefile contains JSON profile data
    if (data.zonefile) {
      try {
        // Zonefiles can contain profile URLs or direct data
        // This is a simplified parser
        const zonefile = data.zonefile;
        
        // Look for common profile patterns
        if (zonefile.includes('$ORIGIN')) {
          // Standard zonefile format
          const lines = zonefile.split('\n');
          for (const line of lines) {
            if (line.includes('TXT') && line.includes('profile')) {
              // Extract profile URL
              const match = line.match(/"([^"]+)"/);
              if (match) {
                profile.website = match[1];
              }
            }
          }
        }
      } catch {
        // Zonefile parsing failed, continue with basic profile
      }
    }

    // Cache the result
    profileCache.set(nameOrAddress, { 
      value: JSON.stringify(profile), 
      timestamp: Date.now() 
    });

    return profile;
  } catch (error) {
    console.error('Error fetching BNS profile:', error);
    return null;
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Check if a string looks like a valid BNS name
 */
export function isValidBNSName(name: string): boolean {
  const parts = name.split('.');
  if (parts.length !== 2) return false;
  
  const [localName, namespace] = parts;
  
  // Check namespace
  const validNamespaces = ['btc', 'stx', 'id', 'app', 'podcast', 'mega'];
  if (!validNamespaces.includes(namespace.toLowerCase())) return false;
  
  // Check name format (alphanumeric and hyphens, 1-37 chars)
  const nameRegex = /^[a-zA-Z0-9-]{1,37}$/;
  return nameRegex.test(localName);
}

/**
 * Format address with optional BNS name
 * Returns "name.btc" or truncated address if no name
 */
export async function formatAddressWithBNS(
  address: string,
  truncate = true
): Promise<string> {
  const name = await resolveAddressToName(address);
  
  if (name) {
    return name;
  }
  
  if (truncate) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  return address;
}

/**
 * Get display name for an address
 * Returns cached name immediately if available, fetches in background
 */
export function getDisplayName(address: string): string {
  // Check cache first for instant return
  const cached = nameCache.get(address);
  if (cached) return cached;
  
  // Return truncated address, but trigger background fetch
  resolveAddressToName(address).catch(() => {});
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Clear the BNS cache
 */
export function clearBNSCache(): void {
  nameCache.clear();
  addressCache.clear();
  profileCache.clear();
}

// ============================================
// BNS AVAILABILITY CHECK
// ============================================

/**
 * Check if a BNS name is available for registration
 */
export async function isNameAvailable(name: string): Promise<boolean> {
  try {
    const address = await resolveNameToAddress(name);
    return address === null;
  } catch {
    return false;
  }
}

/**
 * Search for available BNS names
 */
export function generateNameSuggestions(baseName: string, count = 5): string[] {
  const suggestions: string[] = [];
  const namespaces = ['btc', 'stx'];
  
  // Clean the base name
  const cleaned = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  if (cleaned.length === 0) return [];
  
  // Generate variations
  for (const ns of namespaces) {
    suggestions.push(`${cleaned}.${ns}`);
    suggestions.push(`${cleaned}1.${ns}`);
    suggestions.push(`${cleaned}-x.${ns}`);
  }
  
  return suggestions.slice(0, count);
}
