import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueBadgeProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function ValueBadge({ value, suffix = '%', className }: ValueBadgeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold font-mono px-2 py-0.5 rounded-full',
        isPositive && 'bg-success/15 text-success',
        !isPositive && !isNeutral && 'bg-destructive/15 text-destructive',
        isNeutral && 'bg-muted text-muted-foreground',
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
}
