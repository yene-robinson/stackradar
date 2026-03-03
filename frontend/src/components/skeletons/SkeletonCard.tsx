import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant: 'stat' | 'position' | 'chart';
  delay?: number;
  className?: string;
}

export function SkeletonCard({ variant, delay = 0, className }: SkeletonCardProps) {
  return (
    <div
      className={cn('glass-card p-5 space-y-3', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {variant === 'stat' && (
        <>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </>
      )}
      {variant === 'position' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-1.5 text-right">
              <Skeleton className="h-3 w-8 ml-auto" />
              <Skeleton className="h-6 w-16 ml-auto" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </>
      )}
      {variant === 'chart' && (
        <>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-1">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-7 w-10 rounded-md" />)}
            </div>
          </div>
          <Skeleton className="h-56 w-full rounded-lg" />
        </>
      )}
    </div>
  );
}
