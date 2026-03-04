import { DollarSign, TrendingUp, Sparkles, Plus, Filter, FolderOpen, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/StatCard';
import { PortfolioChart } from '@/components/dashboard/PortfolioChart';
import { PositionCard } from '@/components/dashboard/PositionCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { YieldSidebar } from '@/components/dashboard/YieldSidebar';
import { PriceDisplay } from '@/components/PriceDisplay';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { SEOHead } from '@/components/SEOHead';
import { useDashboardData } from '@/hooks/useData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useWallet, formatAddress } from '@/hooks/useStacksWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  onOpenAddPosition?: () => void;
  onConnectWallet?: () => void;
}

export default function Dashboard({ onOpenAddPosition, onConnectWallet }: DashboardProps) {
  const navigate = useNavigate();
  const { connected, address } = useWallet();
  const { data, isLoading, refresh } = useDashboardData();
  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: refresh });

  const { stats: portfolioStats, positions } = data;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title="Dashboard" description="Your sBTC portfolio overview and performance metrics." />
      <DashboardHeader onConnectWallet={onConnectWallet} />

      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div className="pull-indicator pt-20" style={{ opacity: Math.min(pullDistance / 60, 1) }}>
          <Loader2 className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      <main id="main-content" className="container mx-auto px-4 sm:px-6 pt-20 pb-8 space-y-5">
        {!connected ? (
          <div className="pt-12">
            <ErrorState
              variant="wallet"
              actionLabel="Connect Wallet"
              onAction={onConnectWallet}
            />
          </div>
        ) : (
          <>
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="text-2xl font-bold text-foreground">
                {getGreeting()}, <span className="font-mono text-primary">{formatAddress(address)}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Here's your portfolio overview</p>
            </motion.div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0,1,2].map(i => <SkeletonCard key={i} variant="stat" delay={i * 75} />)}
                  </div>
                  <SkeletonCard variant="chart" />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[0,1,2,3].map(i => <SkeletonCard key={i} variant="position" delay={i * 75} />)}
                    </div>
                    <div className="space-y-6">
                      <SkeletonCard variant="stat" />
                      <SkeletonCard variant="stat" delay={75} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  {/* Stat Cards */}
                  <section aria-label="Portfolio summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={DollarSign} label="Total Value" value={`$${portfolioStats.totalValue.toLocaleString()}`} delta={portfolioStats.change24h} deltaLabel="24h" />
                    <StatCard icon={TrendingUp} label="24h Change" value={`+$${portfolioStats.changeValue24h.toLocaleString()}`} delta={portfolioStats.change24h} deltaLabel="vs yesterday" />
                    <StatCard icon={Sparkles} label="Total Yield Earned" value={`$${portfolioStats.totalYield.toLocaleString()}`} delta={portfolioStats.yieldChange} deltaLabel="this month" />
                  </section>

                  {/* Chart */}
                  <section aria-label="Portfolio chart">
                    <PortfolioChart />
                  </section>

                  {/* Positions + Sidebar */}
                  <section aria-label="Active positions" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Your Positions</h2>
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate('/positions')} className="btn-secondary-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5" /> Filter
                          </button>
                          <button onClick={onOpenAddPosition} className="btn-primary-gradient text-xs px-3 py-1.5 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add Position
                          </button>
                        </div>
                      </div>
                      {positions.length === 0 ? (
                        <EmptyState
                          icon={FolderOpen}
                          title="No positions yet"
                          description="Start building your sBTC portfolio by adding your first position."
                          actionLabel="Add Position"
                          onAction={onOpenAddPosition}
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {positions.map((p, i) => (
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
                    </div>

                    <div className="space-y-6">
                      <PriceDisplay variant="full" />
                      <YieldSidebar />
                      <ActivityFeed />
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
