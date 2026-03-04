import type { Position } from '@/services/dataService';
import { formatCurrency } from '@/services/dataService';
import { ProtocolBadge } from '@/components/ProtocolBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { useWallet } from '@/hooks/useStacksWallet';
import { CONTRACTS } from '@/lib/stacks/contracts';

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const { getExplorerAddressUrl } = useWallet();
  
  // Link to the portfolio-tracker contract where positions are stored
  const contractExplorerUrl = getExplorerAddressUrl(CONTRACTS.portfolioTracker.principal);

  return (
    <div className="glass-card-hover p-4 space-y-3">
      <div className="flex items-start justify-between">
        <ProtocolBadge protocol={position.protocol} size="sm" />
        <div className="flex items-center gap-2">
          <StatusBadge status={position.status} />
          <a
            href={contractExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on explorer"
            className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
            title="View contract on explorer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground">{position.type}</span>
          <p className="font-mono text-lg font-bold text-foreground">{formatCurrency(position.value)}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">APY</span>
          <p className="font-mono text-lg font-bold text-primary">{position.apy}%</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Earned</span>
          <span className="font-mono text-sm font-semibold text-success">{formatCurrency(position.earned)}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{position.amount} {position.asset}</span>
      </div>
    </div>
  );
}
