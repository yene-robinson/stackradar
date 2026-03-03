import { ArrowDownLeft, ArrowUpRight, RefreshCw, Sparkles, Copy, Check } from 'lucide-react';
// Activity history would come from an indexer - using mock for demo
import { recentActivity } from '@/data/mock';
import type { Activity } from '@/data/mock';
import { formatCurrency } from '@/services/dataService';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

const typeConfig: Record<Activity['type'], { icon: typeof ArrowDownLeft; color: string; label: string }> = {
  deposit: { icon: ArrowDownLeft, color: 'text-success', label: 'Deposit' },
  withdraw: { icon: ArrowUpRight, color: 'text-destructive', label: 'Withdraw' },
  yield: { icon: Sparkles, color: 'text-primary', label: 'Yield Earned' },
  swap: { icon: RefreshCw, color: 'text-secondary', label: 'Swap' },
};

export function ActivityFeed() {
  const { copy, copied } = useCopyToClipboard();

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
      <div className="space-y-3">
        {recentActivity.map((a) => {
          const config = typeConfig[a.type];
          const Icon = config.icon;
          return (
            <div key={a.id} className="flex items-center gap-3 py-2">
              <div className={cn('w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center', config.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{config.label}</p>
                <p className="text-xs text-muted-foreground">{a.protocol.name} · {a.date}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium text-foreground">{a.amount} {a.asset}</p>
                <button
                  onClick={() => copy(a.txHash)}
                  className="text-[10px] text-primary font-mono hover:underline inline-flex items-center gap-0.5"
                >
                  {a.txHash.slice(0, 8)}...
                  {copied ? <Check className="w-2.5 h-2.5 text-success" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
