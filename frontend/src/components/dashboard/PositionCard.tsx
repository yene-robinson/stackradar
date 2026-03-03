import type { Position } from '@/services/dataService';
import { formatCurrency } from '@/services/dataService';
import { ProtocolBadge } from '@/components/ProtocolBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  return (
    <div className="glass-card-hover p-4 space-y-3">
      <div className="flex items-start justify-between">
        <ProtocolBadge protocol={position.protocol} size="sm" />
        <StatusBadge status={position.status} />
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
