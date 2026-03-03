import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, List, Filter, ArrowUpDown, ChevronRight, FolderOpen, SearchX, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PositionCard } from '@/components/dashboard/PositionCard';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { SkeletonTable } from '@/components/skeletons/SkeletonTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SEOHead } from '@/components/SEOHead';
import { usePositions } from '@/hooks/useData';
import { formatCurrency } from '@/services/dataService';
import { ProtocolBadge } from '@/components/ProtocolBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useWallet } from '@/hooks/useStacksWallet';

const filterOptions = ['All', 'Lending', 'LP Pool', 'Staking', 'Vault'] as const;
const sortOptions = [
  { label: 'Value', key: 'value' },
  { label: 'APY', key: 'apy' },
  { label: 'Earned', key: 'earned' },
] as const;

export default function Positions({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('value');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const { data: positions, isLoading, refresh } = usePositions();
  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: refresh });

  const filtered = useMemo(() => {
    let result = positions.filter(p => {
      if (filter !== 'All' && p.type !== filter) return false;
      if (search && !p.protocol.name.toLowerCase().includes(search.toLowerCase()) && !p.asset.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    result.sort((a, b) => {
      const key = sortBy as keyof typeof a;
      const av = a[key] as number;
      const bv = b[key] as number;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }, [positions, search, filter, sortBy, sortDir]);

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <SEOHead title="Positions" description="Manage all your sBTC positions across protocols." />
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
          <h1 className="text-2xl font-bold text-foreground">Positions <span className="text-muted-foreground font-mono text-lg">({positions.length})</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all your sBTC positions across protocols</p>
        </motion.div>

        {/* Controls */}
        <div role="toolbar" aria-label="Filters" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search positions..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              {filterOptions.map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn('px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors', filter === f ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              {sortOptions.map(s => (
                <button key={s.key} onClick={() => toggleSort(s.key)} className={cn('px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1', sortBy === s.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  {s.label}
                  {sortBy === s.key && <ArrowUpDown className="w-3 h-3" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
              <button aria-label="Grid view" onClick={() => setView('grid')} className={cn('p-1.5 rounded-md transition-colors', view === 'grid' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button aria-label="List view" onClick={() => setView('list')} className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <span className="sr-only" aria-live="polite">{filtered.length} positions shown</span>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} variant="position" delay={i * 75} />)}
                </div>
              ) : (
                <SkeletonTable rows={5} cols={8} />
              )}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState
                icon={search ? SearchX : FolderOpen}
                title={search ? "No positions found" : "No positions yet"}
                description={search ? `No positions match "${search}". Try a different search term.` : "Start building your portfolio by adding your first position."}
                actionLabel={search ? "Clear Search" : undefined}
                onAction={search ? () => setSearch('') : undefined}
              />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Grid View */}
              {view === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/positions/${p.id}`)}
                      onKeyDown={e => e.key === 'Enter' && navigate(`/positions/${p.id}`)}
                      aria-label={`View ${p.protocol.name} ${p.type} position`}
                      className="cursor-pointer"
                    >
                      <PositionCard position={p} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* List View */}
              {view === 'list' && (
                <div className="glass-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Protocol</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Asset</TableHead>
                        <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                        <TableHead className="text-muted-foreground text-right">Value</TableHead>
                        <TableHead className="text-muted-foreground text-right">APY</TableHead>
                        <TableHead className="text-muted-foreground text-right">Earned</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(p => (
                        <TableRow key={p.id} onClick={() => navigate(`/positions/${p.id}`)} className="cursor-pointer border-border/20 hover:bg-primary/5">
                          <TableCell><ProtocolBadge protocol={p.protocol} size="sm" /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.type}</TableCell>
                          <TableCell className="font-mono text-sm">{p.asset}</TableCell>
                          <TableCell className="font-mono text-sm text-right">{p.amount}</TableCell>
                          <TableCell className="font-mono text-sm font-semibold text-right">{formatCurrency(p.value)}</TableCell>
                          <TableCell className="font-mono text-sm font-semibold text-primary text-right">{p.apy}%</TableCell>
                          <TableCell className="font-mono text-sm text-success text-right">{formatCurrency(p.earned)}</TableCell>
                          <TableCell><StatusBadge status={p.status} /></TableCell>
                          <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
