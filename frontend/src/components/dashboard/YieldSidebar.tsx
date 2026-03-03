import { useFeaturedYields } from '@/hooks/useData';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function YieldSidebar() {
  const { data: yieldOpportunities, isLoading } = useFeaturedYields(4);

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Top Yield Opportunities</h3>
        <Link to="/yield" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {yieldOpportunities.map((y) => (
            <div key={y.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono"
                  style={{ background: `${y.protocol.color}20`, color: y.protocol.color }}
                >
                  {y.protocol.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{y.asset}</p>
                  <p className="text-xs text-muted-foreground">{y.protocol.name} · {y.type}</p>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-primary">{y.apy.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
