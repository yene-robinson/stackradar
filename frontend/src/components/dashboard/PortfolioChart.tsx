import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
// Historical chart data - would come from indexer/price API in production
import { portfolioHistory } from '@/data/mock';
import { cn } from '@/lib/utils';

const ranges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;

const rangeSlice: Record<string, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 90, ALL: 90,
};

export function PortfolioChart() {
  const [range, setRange] = useState<string>('3M');
  const data = portfolioHistory.slice(-rangeSlice[range]);

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                range === r ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`}
              width={55}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(240, 15%, 10%)',
                border: '1px solid hsl(240, 10%, 20%)',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
              }}
              labelStyle={{ color: 'hsl(220, 10%, 55%)' }}
              itemStyle={{ color: 'hsl(33, 93%, 54%)' }}
              formatter={(val: number) => [`$${val.toLocaleString()}`, 'Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(33, 93%, 54%)"
              strokeWidth={2}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
