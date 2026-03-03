import { useState, useMemo } from 'react';
import { Search, Star, TrendingUp, Shield, AlertTriangle, SearchX, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SEOHead } from '@/components/SEOHead';
import { useYieldOpportunities } from '@/hooks/useData';
import { formatCurrency } from '@/services/dataService';
import { ProtocolBadge } from '@/components/ProtocolBadge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useWallet } from '@/hooks/useStacksWallet';

const tabs = [
  { label: 'All', value: 'All' },
  { label: 'Lending', value: 'Lending' },
  { label: 'LP Pools', value: 'LP Pool' },
  { label: 'Staking', value: 'Staking' },
] as const;

const sortOptions = [
  { label: 'APY', key: 'apy' },
  { label: 'TVL', key: 'tvl' },
  { label: 'Risk', key: 'risk' },
] as const;

const riskOrder = { Low: 1, Medium: 2, High: 3 };

export default function Yield({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const { connected } = useWallet();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('apy');
  const { data: yieldOpportunities, isLoading, refresh } = useYieldOpportunities();
  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: refresh });

  const featured = yieldOpportunities.find(y => y.featured);

  const filtered = useMemo(() => {
    let result = yieldOpportunities.filter(y => {
      if (tab !== 'All' && y.type !== tab) return false;
      if (search && !y.protocol.name.toLowerCase().includes(search.toLowerCase()) && !y.asset.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === 'risk') return riskOrder[a.risk] - riskOrder[b.risk];
      return (b as any)[sortBy] - (a as any)[sortBy];
    });
    return result;
  }, [yieldOpportunities, search, tab, sortBy]);

  const riskColor = (risk: string) => risk === 'Low' ? 'text-success' : risk === 'Medium' ? 'text-warning' : 'text-destructive';
  const riskIcon = (risk: string) => risk === 'Low' ? Shield : risk === 'Medium' ? AlertTriangle : AlertTriangle;

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <SEOHead title="Yield Explorer" description="Discover the best yield opportunities across Stacks protocols." />
      <DashboardHeader onConnectWallet={onOpenWallet} />

      {(pullDistance > 0 || refreshing) && (
        <div className="pull-indicator pt-20" style={{ opacity: Math.min(pullDistance / 60, 1) }}>
          <Loader2 className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      <main id="main-content" className="container mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-5">
        {!connected ? (
          <div className="pt-12">
            <ErrorState variant="wallet" actionLabel="Connect Wallet" onAction={onOpenWallet} />
          </div>
        ) : (
        <>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Yield Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover the best yield opportunities across Stacks protocols</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <SkeletonCard variant="chart" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} variant="position" delay={i * 75} />)}
              </div>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Featured Opportunity */}
              {featured && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 relative overflow-hidden">
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Star className="w-3 h-3" /> Featured
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex-1 space-y-3">
                      <ProtocolBadge protocol={featured.protocol} size="md" />
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-4xl font-extrabold text-primary">{featured.apy}%</span>
                        <span className="text-sm text-muted-foreground">APY</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{featured.type} · {featured.asset}</span>
                        <span>TVL: {formatCurrency(featured.tvl)}</span>
                        <span className={riskColor(featured.risk)}>{featured.risk} Risk</span>
                      </div>
                    </div>
                    <button onClick={() => toast.success('Starting earning flow...')} className="btn-primary-gradient text-sm px-6 py-2.5">
                      Start Earning
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Controls */}
              <div role="toolbar" aria-label="Filters" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                    {tabs.map(t => (
                      <button key={t.value} onClick={() => setTab(t.value)} className={cn('px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors', tab === t.value ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                        {t.label}
                        <span className="ml-1 text-[10px] opacity-60">
                          ({yieldOpportunities.filter(y => t.value === 'All' || y.type === t.value).length})
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                    {sortOptions.map(s => (
                      <button key={s.key} onClick={() => setSortBy(s.key)} className={cn('px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors', sortBy === s.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <span className="sr-only" aria-live="polite">{filtered.length} opportunities shown</span>

              {/* Grid */}
              {filtered.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No opportunities found"
                  description="No yield opportunities match your current filters. Try adjusting your search."
                  actionLabel="Clear Filters"
                  onAction={() => { setSearch(''); setTab('All'); }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((y, i) => {
                    const RiskIcon = riskIcon(y.risk);
                    return (
                      <motion.div key={y.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-hover p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <ProtocolBadge protocol={y.protocol} size="sm" />
                          <span className={cn('flex items-center gap-1 text-xs font-medium', riskColor(y.risk))}>
                            <RiskIcon className="w-3 h-3" /> {y.risk}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">{y.type} · {y.asset}</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-mono text-2xl font-bold text-primary">{y.apy}%</span>
                            <span className="text-xs text-muted-foreground">APY</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                          <span>TVL: {formatCurrency(y.tvl)}</span>
                          <span>Min: {y.minDeposit} sBTC</span>
                        </div>
                        <button onClick={() => toast.success(`Starting ${y.protocol.name} earning flow...`)} className="w-full btn-primary-gradient text-xs py-2">
                          Start Earning
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </main>
    </div>
  );
}
