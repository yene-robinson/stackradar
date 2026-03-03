import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Protocol } from '@/services/dataService';

interface ProtocolBadgeProps {
  protocol: Protocol;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProtocolBadge({ protocol, size = 'md', className }: ProtocolBadgeProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6 text-[10px]', text: 'text-xs' },
    md: { icon: 'w-8 h-8 text-xs', text: 'text-sm' },
    lg: { icon: 'w-10 h-10 text-sm', text: 'text-base' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('rounded-lg flex items-center justify-center font-bold font-mono', sizes[size].icon)}
        style={{ background: `${protocol.color}20`, color: protocol.color }}
      >
        {protocol.icon}
      </div>
      <div className="flex items-center gap-1">
        <span className={cn('font-medium text-foreground', sizes[size].text)}>{protocol.name}</span>
        {protocol.verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
      </div>
      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-mono">
        {protocol.chain}
      </span>
    </div>
  );
}
