// StackRadar Mock Data

export interface Protocol {
  id: string;
  name: string;
  icon: string;
  chain: string;
  verified: boolean;
  color: string;
}

export interface Position {
  id: string;
  protocol: Protocol;
  type: 'Lending' | 'LP Pool' | 'Staking' | 'Vault';
  asset: string;
  amount: number;
  value: number;
  apy: number;
  earned: number;
  status: 'active' | 'pending' | 'inactive';
  depositDate: string;
}

export interface YieldOpportunity {
  id: string;
  protocol: Protocol;
  type: 'Lending' | 'LP Pool' | 'Staking' | 'Vault';
  apy: number;
  tvl: number;
  risk: 'Low' | 'Medium' | 'High';
  minDeposit: number;
  asset: string;
  featured?: boolean;
}

export interface Activity {
  id: string;
  type: 'deposit' | 'withdraw' | 'yield' | 'swap';
  protocol: Protocol;
  amount: number;
  asset: string;
  date: string;
  txHash: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export const protocols: Protocol[] = [
  { id: 'alex', name: 'ALEX Lab', icon: 'A', chain: 'Stacks', verified: true, color: '#F7931A' },
  { id: 'arkadiko', name: 'Arkadiko', icon: 'K', chain: 'Stacks', verified: true, color: '#5546FF' },
  { id: 'stackswap', name: 'StackSwap', icon: 'S', chain: 'Stacks', verified: true, color: '#22C55E' },
  { id: 'velar', name: 'Velar', icon: 'V', chain: 'Stacks', verified: true, color: '#EAB308' },
  { id: 'zest', name: 'Zest Protocol', icon: 'Z', chain: 'Stacks', verified: true, color: '#3B82F6' },
  { id: 'bitflow', name: 'Bitflow', icon: 'B', chain: 'Stacks', verified: false, color: '#EC4899' },
];

export const positions: Position[] = [
  { id: '1', protocol: protocols[0], type: 'Lending', asset: 'sBTC', amount: 2.45, value: 156420, apy: 5.8, earned: 1842, status: 'active', depositDate: '2025-12-15' },
  { id: '2', protocol: protocols[1], type: 'Vault', asset: 'sBTC', amount: 1.2, value: 76560, apy: 8.2, earned: 2105, status: 'active', depositDate: '2025-11-03' },
  { id: '3', protocol: protocols[2], type: 'LP Pool', asset: 'sBTC/STX', amount: 0.8, value: 51040, apy: 12.4, earned: 3200, status: 'active', depositDate: '2025-10-20' },
  { id: '4', protocol: protocols[3], type: 'Staking', asset: 'sBTC', amount: 0.5, value: 31900, apy: 4.2, earned: 560, status: 'active', depositDate: '2026-01-08' },
  { id: '5', protocol: protocols[4], type: 'Lending', asset: 'sBTC', amount: 1.85, value: 118030, apy: 6.5, earned: 1480, status: 'pending', depositDate: '2026-02-01' },
];

export const yieldOpportunities: YieldOpportunity[] = [
  { id: '1', protocol: protocols[2], type: 'LP Pool', apy: 14.2, tvl: 4200000, risk: 'Medium', minDeposit: 0.01, asset: 'sBTC/STX', featured: true },
  { id: '2', protocol: protocols[1], type: 'Vault', apy: 9.8, tvl: 8500000, risk: 'Low', minDeposit: 0.05, asset: 'sBTC' },
  { id: '3', protocol: protocols[0], type: 'Lending', apy: 7.2, tvl: 12000000, risk: 'Low', minDeposit: 0.001, asset: 'sBTC' },
  { id: '4', protocol: protocols[3], type: 'Staking', apy: 5.5, tvl: 3200000, risk: 'Low', minDeposit: 0.1, asset: 'sBTC' },
  { id: '5', protocol: protocols[5], type: 'LP Pool', apy: 18.5, tvl: 1800000, risk: 'High', minDeposit: 0.01, asset: 'sBTC/USDA' },
  { id: '6', protocol: protocols[4], type: 'Lending', apy: 6.8, tvl: 9500000, risk: 'Low', minDeposit: 0.01, asset: 'sBTC' },
];

export const recentActivity: Activity[] = [
  { id: '1', type: 'deposit', protocol: protocols[0], amount: 0.5, asset: 'sBTC', date: '2026-02-20', txHash: '0x1a2b3c' },
  { id: '2', type: 'yield', protocol: protocols[1], amount: 0.012, asset: 'sBTC', date: '2026-02-19', txHash: '0x4d5e6f' },
  { id: '3', type: 'swap', protocol: protocols[2], amount: 0.3, asset: 'sBTC→STX', date: '2026-02-18', txHash: '0x7g8h9i' },
  { id: '4', type: 'withdraw', protocol: protocols[3], amount: 0.15, asset: 'sBTC', date: '2026-02-17', txHash: '0xj0k1l2' },
  { id: '5', type: 'deposit', protocol: protocols[4], amount: 1.0, asset: 'sBTC', date: '2026-02-15', txHash: '0xm3n4o5' },
];

export const portfolioHistory: ChartDataPoint[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date('2025-11-25');
  date.setDate(date.getDate() + i);
  const base = 350000;
  const trend = i * 1200;
  const noise = Math.sin(i * 0.3) * 15000 + Math.cos(i * 0.7) * 8000;
  return {
    date: date.toISOString().split('T')[0],
    value: Math.round(base + trend + noise),
  };
});

export const portfolioStats = {
  totalValue: 433950,
  change24h: 2.4,
  changeValue24h: 10190,
  totalYield: 9187,
  yieldChange: 12.8,
  activePositions: 5,
};

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

export const formatBTC = (value: number): string => `${value.toFixed(4)} sBTC`;

// Position history generator
export function positionHistory(positionId: string): ChartDataPoint[] {
  const position = positions.find(p => p.id === positionId);
  const baseValue = position ? position.value * 0.85 : 50000;
  return Array.from({ length: 60 }, (_, i) => {
    const date = new Date('2025-12-20');
    date.setDate(date.getDate() + i);
    const trend = i * (baseValue * 0.003);
    const noise = Math.sin(i * 0.4) * baseValue * 0.03 + Math.cos(i * 0.9) * baseValue * 0.015;
    return { date: date.toISOString().split('T')[0], value: Math.round(baseValue + trend + noise) };
  });
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'yield' | 'swap';
  amount: number;
  asset: string;
  date: string;
  txHash: string;
  status: 'confirmed' | 'pending';
}

export const positionTransactions: Record<string, Transaction[]> = {
  '1': [
    { id: 't1', type: 'deposit', amount: 1.5, asset: 'sBTC', date: '2025-12-15', txHash: '0xa1b2c3', status: 'confirmed' },
    { id: 't2', type: 'deposit', amount: 0.95, asset: 'sBTC', date: '2026-01-10', txHash: '0xd4e5f6', status: 'confirmed' },
    { id: 't3', type: 'yield', amount: 0.028, asset: 'sBTC', date: '2026-02-18', txHash: '0xg7h8i9', status: 'confirmed' },
  ],
  '2': [
    { id: 't4', type: 'deposit', amount: 1.2, asset: 'sBTC', date: '2025-11-03', txHash: '0xj0k1l2', status: 'confirmed' },
    { id: 't5', type: 'yield', amount: 0.033, asset: 'sBTC', date: '2026-02-15', txHash: '0xm3n4o5', status: 'confirmed' },
  ],
  '3': [
    { id: 't6', type: 'deposit', amount: 0.8, asset: 'sBTC', date: '2025-10-20', txHash: '0xp6q7r8', status: 'confirmed' },
    { id: 't7', type: 'swap', amount: 0.3, asset: 'sBTC→STX', date: '2025-11-15', txHash: '0xs9t0u1', status: 'confirmed' },
    { id: 't8', type: 'yield', amount: 0.05, asset: 'sBTC', date: '2026-02-10', txHash: '0xv2w3x4', status: 'confirmed' },
  ],
  '4': [
    { id: 't9', type: 'deposit', amount: 0.5, asset: 'sBTC', date: '2026-01-08', txHash: '0xy5z6a7', status: 'confirmed' },
  ],
  '5': [
    { id: 't10', type: 'deposit', amount: 1.85, asset: 'sBTC', date: '2026-02-01', txHash: '0xb8c9d0', status: 'pending' },
  ],
};

// Allocation data for donut chart
export const allocationData = [
  { name: 'ALEX Lab', value: 156420, color: '#F7931A' },
  { name: 'Arkadiko', value: 76560, color: '#5546FF' },
  { name: 'StackSwap', value: 51040, color: '#22C55E' },
  { name: 'Velar', value: 31900, color: '#EAB308' },
  { name: 'Zest Protocol', value: 118030, color: '#3B82F6' },
];

// Yield breakdown data (monthly)
export const yieldBreakdownData = [
  { month: 'Sep', alex: 120, arkadiko: 180, stackswap: 250, velar: 40, zest: 90 },
  { month: 'Oct', alex: 200, arkadiko: 220, stackswap: 320, velar: 55, zest: 130 },
  { month: 'Nov', alex: 280, arkadiko: 310, stackswap: 400, velar: 70, zest: 180 },
  { month: 'Dec', alex: 350, arkadiko: 380, stackswap: 520, velar: 90, zest: 250 },
  { month: 'Jan', alex: 420, arkadiko: 450, stackswap: 650, velar: 120, zest: 340 },
  { month: 'Feb', alex: 472, arkadiko: 515, stackswap: 760, velar: 145, zest: 390 },
];

// Risk metrics
export const riskMetrics = {
  score: 34,
  level: 'Low-Medium' as const,
  factors: [
    { name: 'Diversification', score: 72, description: 'Spread across 5 protocols' },
    { name: 'Protocol Maturity', score: 85, description: 'Mostly established protocols' },
    { name: 'Smart Contract Risk', score: 60, description: 'Audited contracts with coverage' },
    { name: 'Concentration Risk', score: 45, description: 'Heavy sBTC concentration' },
  ],
  concentrations: [
    { protocol: 'ALEX Lab', percentage: 36, color: '#F7931A' },
    { protocol: 'Zest Protocol', percentage: 27, color: '#3B82F6' },
    { protocol: 'Arkadiko', percentage: 18, color: '#5546FF' },
    { protocol: 'StackSwap', percentage: 12, color: '#22C55E' },
    { protocol: 'Velar', percentage: 7, color: '#EAB308' },
  ],
  recommendations: [
    'Consider diversifying into stablecoin-based yield strategies',
    'Increase exposure to audited vaults for lower risk',
    'Monitor ALEX Lab concentration — currently 36% of portfolio',
    'Enable automatic yield harvesting to compound returns',
  ],
};
