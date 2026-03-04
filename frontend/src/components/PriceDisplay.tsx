/**
 * Token Price Display Component
 * 
 * Shows real-time token prices with 24h change
 */

import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { usePrices } from '@/hooks/usePrices';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  variant?: 'compact' | 'full';
  showRefresh?: boolean;
  className?: string;
}

export function PriceDisplay({ variant = 'compact', showRefresh = false, className }: PriceDisplayProps) {
  const { 
    stxPrice, 
    sbtcPrice, 
    stx24hChange, 
    btc24hChange, 
    loading, 
    prices,
    refresh,
    formatUSD,
    formatPercentChange,
  } = usePrices();

  const renderChange = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <span className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-medium',
        isPositive ? 'text-success' : 'text-destructive'
      )}>
        <Icon className="w-2.5 h-2.5" />
        {formatPercentChange(change)}
      </span>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 text-xs', className)}>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">STX</span>
          <span className={cn('font-mono font-medium', loading && 'animate-pulse')}>
            {formatUSD(stxPrice)}
          </span>
          {renderChange(stx24hChange)}
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1.5">
          <span className="text-orange-400 font-medium">sBTC</span>
          <span className={cn('font-mono font-medium', loading && 'animate-pulse')}>
            {formatUSD(sbtcPrice, { compact: true })}
          </span>
          {renderChange(btc24hChange)}
        </div>
        {prices.isStale && (
          <AlertTriangle className="w-3 h-3 text-warning" title="Prices may be outdated" />
        )}
        {showRefresh && (
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh prices"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          </button>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('glass-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Live Prices</h3>
        {prices.isStale && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-medium flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Stale
          </span>
        )}
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh prices"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* STX Price */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">STX</span>
            </div>
            <span className="text-sm font-medium text-foreground">Stacks</span>
          </div>
          <div className={cn('font-mono text-lg font-bold text-foreground', loading && 'animate-pulse')}>
            {formatUSD(stxPrice)}
          </div>
          {renderChange(stx24hChange)}
        </div>

        {/* sBTC Price */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-orange-400">sBTC</span>
            </div>
            <span className="text-sm font-medium text-foreground">sBTC</span>
          </div>
          <div className={cn('font-mono text-lg font-bold text-foreground', loading && 'animate-pulse')}>
            {formatUSD(sbtcPrice, { compact: true })}
          </div>
          {renderChange(btc24hChange)}
        </div>
      </div>
      
      {prices.lastFetched > 0 && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated {formatTimeAgo(prices.lastFetched)}
        </p>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}
