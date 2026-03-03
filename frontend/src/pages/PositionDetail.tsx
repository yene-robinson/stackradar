import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ArrowDownToLine, XCircle, ExternalLink, CheckCircle, Clock, Copy, Check, FolderOpen, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
// Position history and transactions still use mock (contracts don't store detailed history)
import { positionHistory, positionTransactions } from '@/data/mock';
import { usePositions } from '@/hooks/useData';
import { formatCurrency } from '@/services/dataService';
import { StatCard } from '@/components/StatCard';
import { ProtocolBadge } from '@/components/ProtocolBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import { SEOHead } from '@/components/SEOHead';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

const ranges = ['1W', '1M', '3M', 'ALL'] as const;
const rangeSlice: Record<string, number> = { '1W': 7, '1M': 30, '3M': 60, ALL: 60 };

export default function PositionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState<string>('3M');
  const { data: positions, isLoading } = usePositions();
  const { copy, copied } = useCopyToClipboard();

  const position = positions.find(p => p.id === id);

  if (!position) return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 pt-20 pb-8">
        <SEOHead title="Position Not Found" />
        <EmptyState
          icon={FolderOpen}
          title="Position not found"
          description="This position doesn't exist or has been removed."
          actionLabel="Back to Positions"
          onAction={() => navigate('/positions')}
        />
      </main>
    </div>
  );

  const history = positionHistory(position.id).slice(-rangeSlice[range]);
  const txs = positionTransactions[position.id] || [];
  const depositedValue = position.value - position.earned;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${position.protocol.name} ${position.type}`} description={`${position.protocol.name} ${position.type} position details and performance.`} />
      <DashboardHeader />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-5">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <SkeletonCard variant="stat" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0,1,2].map(i => <SkeletonCard key={i} variant="stat" delay={i * 75} />)}
              </div>
              <SkeletonCard variant="chart" />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Back + Protocol Header */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <button onClick={() => navigate('/positions')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Positions
                </button>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-mono" style={{ background: `${position.protocol.color}20`, color: position.protocol.color }}>
                      {position.protocol.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-foreground">{position.protocol.name}</h1>
                        {position.protocol.verified && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Verified</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{position.type} · {position.asset} · {position.protocol.chain}</p>
                    </div>
                  </div>
                  <StatusBadge status={position.status} />
                </div>
              </motion.div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={DollarSign} label="Deposited Value" value={formatCurrency(depositedValue)} />
                <StatCard icon={TrendingUp} label="Current Value" value={formatCurrency(position.value)} delta={((position.value - depositedValue) / depositedValue * 100)} deltaLabel="total" />
                <StatCard icon={Sparkles} label="Earned Yield" value={formatCurrency(position.earned)} delta={position.apy} deltaLabel="APY" />
              </div>

              {/* Chart */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Position Value</h3>
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                    {ranges.map(r => (
                      <button key={r} onClick={() => setRange(r)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', range === r ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} tickFormatter={v => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} interval="preserveStartEnd" />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} width={55} />
                      <Tooltip contentStyle={{ background: 'hsl(240, 15%, 10%)', border: '1px solid hsl(240, 10%, 20%)', borderRadius: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Value']} />
                      <Area type="monotone" dataKey="value" stroke="hsl(33, 93%, 54%)" strokeWidth={2} fill="url(#posGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Metadata + Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-5 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Position Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Type', value: position.type },
                      { label: 'APY', value: `${position.apy}%` },
                      { label: 'Deposit Date', value: position.depositDate },
                      { label: 'Lock Period', value: 'None' },
                      { label: 'Amount', value: `${position.amount} ${position.asset}` },
                      { label: 'Fees', value: '0.3%' },
                    ].map(item => (
                      <div key={item.label}>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <p className="font-mono text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-5 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
                  <div className="space-y-3">
                    <button onClick={() => toast.success('Add More flow initiated')} className="w-full btn-primary-gradient text-sm py-2.5 flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add More
                    </button>
                    <button onClick={() => toast.success('Yield withdrawal initiated')} className="w-full btn-secondary-ghost text-sm py-2.5 flex items-center justify-center gap-2">
                      <ArrowDownToLine className="w-4 h-4" /> Withdraw Yield
                    </button>
                    <button onClick={() => toast.error('Position closure requires confirmation')} className="w-full px-6 py-2.5 rounded-lg text-sm font-semibold border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" /> Close Position
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border/30">
                  <h3 className="text-sm font-medium text-muted-foreground">Transaction History</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Tx Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txs.map(tx => (
                      <TableRow key={tx.id} className="border-border/20">
                        <TableCell>
                          <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium capitalize',
                            tx.type === 'deposit' ? 'text-success' : tx.type === 'withdraw' ? 'text-destructive' : tx.type === 'yield' ? 'text-primary' : 'text-secondary'
                          )}>
                            {tx.type === 'deposit' ? <ArrowDownToLine className="w-3.5 h-3.5" /> : tx.type === 'yield' ? <Sparkles className="w-3.5 h-3.5" /> : null}
                            {tx.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-right">{tx.amount} {tx.asset}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', tx.status === 'confirmed' ? 'text-success' : 'text-warning')}>
                            {tx.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {tx.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => copy(tx.txHash)}
                            className="font-mono text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            {tx.txHash.slice(0, 8)}...
                            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
