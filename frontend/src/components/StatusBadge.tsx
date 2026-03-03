import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'pending' | 'inactive' | 'error';
  className?: string;
}

const config = {
  active: { label: 'Live', dotClass: 'bg-success shadow-[0_0_6px_hsla(142,71%,45%,0.6)] animate-pulse' , badgeClass: 'bg-success/10 text-success' },
  pending: { label: 'Pending', dotClass: 'bg-warning', badgeClass: 'bg-warning/10 text-warning' },
  inactive: { label: 'Inactive', dotClass: 'bg-muted-foreground', badgeClass: 'bg-muted text-muted-foreground' },
  error: { label: 'Error', dotClass: 'bg-destructive', badgeClass: 'bg-destructive/10 text-destructive' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', c.badgeClass, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dotClass)} />
      {c.label}
    </span>
  );
}
