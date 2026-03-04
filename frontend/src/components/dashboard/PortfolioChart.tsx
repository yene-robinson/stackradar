import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolioHistory, PortfolioRange, formatChartDate, formatChartValue } from '@/hooks/usePortfolioHistory';

const ranges: PortfolioRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export function PortfolioChart() {
  const { data, isLoading, error, range, setRange, refresh, isConnected } = usePortfolioHistory('3M');
  
  // Calculate change for current range
  const currentValue = data[data.length - 1]?.value || 0;
  const startValue = data[0]?.value || 0;
  const change = currentValue - startValue;
  const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
          {isConnected && currentValue > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold font-mono">{formatChartValue(currentValue)}</span>
              <span className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
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
      </div>
      
      <div className="h-64">
        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Wallet className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Connect wallet to view portfolio history</p>
          </div>
        ) : isLoading && data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm text-red-400">{error}</p>
            <button 
              onClick={refresh}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : currentValue === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No portfolio data yet</p>
            <p className="text-xs mt-1">Get some STX or sBTC to start tracking</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }}
                tickFormatter={(val) => formatChartDate(val, range)}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }}
                tickFormatter={(val) => formatChartValue(val)}
                width={55}
                domain={['dataMin * 0.95', 'dataMax * 1.05']}
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
                itemStyle={{ color: isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)' }}
                labelFormatter={(val: number) => new Date(val).toLocaleString()}
                formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)'}
                strokeWidth={2}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
