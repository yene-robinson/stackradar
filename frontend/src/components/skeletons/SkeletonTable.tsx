import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 8 }: SkeletonTableProps) {
  const widths = ['w-24', 'w-16', 'w-20', 'w-16', 'w-20', 'w-14', 'w-16', 'w-14'];

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border/30 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${widths[i % widths.length]}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="p-4 flex gap-6 border-b border-border/20"
          style={{ animationDelay: `${row * 75}ms` }}
        >
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} className={`h-4 ${widths[col % widths.length]}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
