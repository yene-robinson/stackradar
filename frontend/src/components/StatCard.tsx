import { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  className?: string;
}

function useCountUp(target: string, duration = 1200) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const numericMatch = target.match(/[\d,.]+/);
    if (!numericMatch) { setDisplay(target); setDone(true); return; }

    const prefix = target.slice(0, target.indexOf(numericMatch[0]));
    const suffix = target.slice(target.indexOf(numericMatch[0]) + numericMatch[0].length);
    const end = parseFloat(numericMatch[0].replace(/,/g, ''));
    const hasDecimals = numericMatch[0].includes('.');
    const decimalPlaces = hasDecimals ? numericMatch[0].split('.')[1].length : 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = end * eased;
      const formatted = hasDecimals
        ? current.toLocaleString('en-US', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })
        : Math.round(current).toLocaleString('en-US');
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
      else setDone(true);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return { display, done };
}

export function StatCard({ icon: Icon, label, value, delta, deltaLabel, className }: StatCardProps) {
  const { display, done } = useCountUp(value);

  return (
    <div className={cn('glass-card p-4 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div
        className={cn('font-mono text-2xl font-bold tracking-tight text-foreground', done && 'value-flash')}
        aria-live="polite"
        aria-atomic="true"
      >
        {display}
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full font-mono',
              delta >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
            )}
          >
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
          </span>
          {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
