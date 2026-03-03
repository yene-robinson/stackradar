import { useState } from 'react';
import { Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { SEOHead } from '@/components/SEOHead';
// Analytics chart data still uses mock (contracts don't store historical data)
import { portfolioHistory, allocationData, yieldBreakdownData, riskMetrics } from '@/data/mock';
import { usePortfolioStats } from '@/hooks/useData';
import { formatCurrency } from '@/services/dataService';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useStacksWallet';

const ranges = ['1M', '3M', '1Y', 'ALL'] as const;
const rangeSlice: Record<string, number> = { '1M': 30, '3M': 90, '1Y': 90, ALL: 90 };

export default function Analytics({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const { connected } = useWallet();
  const [range, setRange] = useState<string>('3M');
  const { data: portfolioStats, isLoading } = usePortfolioStats();
  const data = portfolioHistory.slice(-rangeSlice[range]);
  const currentValue = portfolioStats.totalValue;
  const highValue = Math.max(...data.map(d => d.value));
  const lowValue = Math.min(...data.map(d => d.value));
  const totalAllocation = allocationData.reduce((s, d) => s + d.value, 0);

  const scoreColor = riskMetrics.score <= 30 ? 'hsl(142, 71%, 45%)' : riskMetrics.score <= 60 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)';
  const scoreAngle = (riskMetrics.score / 100) * 180;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Analytics" description="Deep insights into your sBTC portfolio performance." />
      <DashboardHeader onConnectWallet={onOpenWallet} />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-5">
        {!connected ? (
          <div className="pt-12">
            <ErrorState variant="wallet" actionLabel="Connect Wallet" onAction={onOpenWallet} />
          </div>
        ) : (
        <>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Deep insights into your portfolio performance</p>
          </div>
          <button onClick={() => toast.success('Report exported successfully!')} className="btn-secondary-ghost text-xs px-4 py-2 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <SkeletonCard variant="chart" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard variant="chart" delay={75} />
                <SkeletonCard variant="chart" delay={150} />
              </div>
              <SkeletonCard variant="chart" delay={225} />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Performance Overview */}
              <section aria-label="Performance overview" className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-xs text-muted-foreground">Current</span>
                      <p className="font-mono text-xl font-bold text-foreground">{formatCurrency(currentValue)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">High</span>
                      <p className="font-mono text-sm font-semibold text-success">{formatCurrency(highValue)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Low</span>
                      <p className="font-mono text-sm font-semibold text-destructive">{formatCurrency(lowValue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                    {ranges.map(r => (
                      <button key={r} onClick={() => setRange(r)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', range === r ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} tickFormatter={v => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} interval="preserveStartEnd" />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} width={55} />
                      <Tooltip contentStyle={{ background: 'hsl(240, 15%, 10%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Value']} />
                      <Area type="monotone" dataKey="value" stroke="hsl(33, 93%, 54%)" strokeWidth={2} fill="url(#analyticsGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Allocation Donut */}
                <section aria-label="Portfolio allocation" className="glass-card p-5 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Portfolio Allocation</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={allocationData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                            {allocationData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'hsl(240, 15%, 10%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono' }} formatter={(val: number) => [formatCurrency(val), 'Value']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {allocationData.map(d => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                            <span className="text-foreground">{d.name}</span>
                          </div>
                          <span className="font-mono text-muted-foreground">{((d.value / totalAllocation) * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Yield Breakdown */}
                <section aria-label="Yield breakdown" className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Yield Breakdown</h3>
                    <span className="font-mono text-sm font-semibold text-primary">{formatCurrency(portfolioStats.totalYield)} earned</span>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yieldBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 16%)" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} tickFormatter={v => `$${v}`} width={45} />
                        <Tooltip contentStyle={{ background: 'hsl(240, 15%, 10%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono' }} />
                        <Bar dataKey="alex" stackId="a" fill="#F7931A" radius={[0, 0, 0, 0]} name="ALEX" />
                        <Bar dataKey="arkadiko" stackId="a" fill="#5546FF" name="Arkadiko" />
                        <Bar dataKey="stackswap" stackId="a" fill="#22C55E" name="StackSwap" />
                        <Bar dataKey="velar" stackId="a" fill="#EAB308" name="Velar" />
                        <Bar dataKey="zest" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Zest" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              {/* Risk Analysis */}
              <section aria-label="Risk analysis" className="glass-card p-5 space-y-5">
                <h3 className="text-sm font-medium text-muted-foreground">Risk Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gauge */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-40 h-24 overflow-hidden">
                      <svg viewBox="0 0 160 90" className="w-full h-full">
                        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="hsl(240, 10%, 16%)" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={scoreColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${scoreAngle * 2.18} 1000`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                        <span className="font-mono text-3xl font-extrabold text-foreground">{riskMetrics.score}</span>
                        <span className="text-xs text-muted-foreground">{riskMetrics.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Concentration */}
                  <div className="space-y-3">
                    <span className="text-xs text-muted-foreground font-medium">Protocol Concentration</span>
                    {riskMetrics.concentrations.map(c => (
                      <div key={c.protocol} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground">{c.protocol}</span>
                          <span className="font-mono text-muted-foreground">{c.percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${c.percentage}%`, background: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Factors + Recs */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground font-medium">Risk Factors</span>
                      {riskMetrics.factors.map(f => (
                        <div key={f.name} className="flex items-center gap-2 text-xs">
                          <div className={cn('w-1.5 h-1.5 rounded-full', f.score >= 70 ? 'bg-success' : f.score >= 50 ? 'bg-warning' : 'bg-destructive')} />
                          <span className="text-foreground">{f.name}</span>
                          <span className="font-mono text-muted-foreground ml-auto">{f.score}/100</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground font-medium">Recommendations</span>
                      {riskMetrics.recommendations.slice(0, 2).map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                          <Info className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </main>
    </div>
  );
}
