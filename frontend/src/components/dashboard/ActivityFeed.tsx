import { ArrowDownLeft, ArrowUpRight, RefreshCw, Sparkles, Copy, Check, ExternalLink, FileCode, Loader2, Coins } from 'lucide-react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import type { Transaction, TransactionType } from '@/services/transactionService';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useWallet } from '@/hooks/useStacksWallet';
import { AddressDisplay } from '@/components/AddressDisplay';

const typeConfig: Record<TransactionType, { icon: typeof ArrowDownLeft; color: string; label: string }> = {
  deposit: { icon: ArrowDownLeft, color: 'text-success', label: 'Deposit' },
  withdraw: { icon: ArrowUpRight, color: 'text-destructive', label: 'Withdraw' },
  yield: { icon: Sparkles, color: 'text-primary', label: 'Yield Earned' },
  swap: { icon: RefreshCw, color: 'text-secondary', label: 'Swap' },
  token_transfer: { icon: Coins, color: 'text-blue-400', label: 'Transfer' },
  contract_call: { icon: FileCode, color: 'text-purple-400', label: 'Contract Call' },
  coinbase: { icon: Sparkles, color: 'text-yellow-400', label: 'Mining Reward' },
};

export function ActivityFeed() {
  const { copy, copied } = useCopyToClipboard();
  const { connected } = useWallet();
  const { transactions, pendingTransactions, loading, error, refresh, hasMore, loadMore } = useTransactionHistory({ limit: 5 });
  
  // Combine pending and confirmed transactions
  const allTransactions = [...pendingTransactions, ...transactions];

  if (!connected) {
    return (
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground py-4 text-center">Connect wallet to view activity</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
        <button 
          onClick={refresh}
          disabled={loading}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Refresh activity"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>
      
      {error && (
        <p className="text-xs text-destructive py-2">{error}</p>
      )}
      
      {loading && allTransactions.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : allTransactions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {allTransactions.slice(0, 5).map((tx) => {
            const config = typeConfig[tx.type] || typeConfig.contract_call;
            const Icon = config.icon;
            const isPending = tx.status === 'pending';
            
            return (
              <div key={tx.id} className={cn("flex items-center gap-3 py-2", isPending && "opacity-70")}>
                <div className={cn('w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center relative', config.color)}>
                  <Icon className="w-4 h-4" />
                  {isPending && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    {isPending && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-medium">
                        PENDING
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {tx.contractCall ? (
                      <span className="font-mono">{tx.contractCall.functionName}</span>
                    ) : tx.recipient ? (
                      <AddressDisplay address={tx.recipient} prefix="To:" />
                    ) : (
                      tx.date
                    )}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {tx.amount > 0 && (
                    <p className="font-mono text-sm font-medium text-foreground">
                      {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tx.asset}
                    </p>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copy(tx.txId)}
                      className="text-[10px] text-muted-foreground font-mono hover:text-primary inline-flex items-center gap-0.5"
                    >
                      {tx.txId.slice(0, 8)}...
                      {copied ? <Check className="w-2.5 h-2.5 text-success" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
                    </button>
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
          
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full text-xs text-primary hover:underline py-2 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
