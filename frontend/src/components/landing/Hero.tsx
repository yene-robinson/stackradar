import { useState, useEffect } from 'react';
import { ArrowRight, BarChart3, Shield, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  onLaunchApp?: () => void;
  isConnecting?: boolean;
}

const sparklineSets = [
  [
    'M0,16 L8,12 L16,14 L24,8 L32,10 L40,4 L48,6 L56,2 L60,3',
    'M0,10 L8,14 L16,6 L24,12 L32,4 L40,8 L48,2 L56,6 L60,4',
    'M0,18 L8,16 L16,14 L24,13 L32,10 L40,8 L48,6 L56,4 L60,2',
  ],
  [
    'M0,14 L8,10 L16,12 L24,6 L32,8 L40,3 L48,5 L56,4 L60,2',
    'M0,12 L8,16 L16,8 L24,14 L32,6 L40,10 L48,4 L56,8 L60,3',
    'M0,16 L8,14 L16,12 L24,11 L32,8 L40,6 L48,4 L56,3 L60,2',
  ],
  [
    'M0,18 L8,14 L16,16 L24,10 L32,12 L40,6 L48,8 L56,4 L60,5',
    'M0,8 L8,12 L16,4 L24,10 L32,2 L40,6 L48,4 L56,8 L60,6',
    'M0,14 L8,12 L16,10 L24,9 L32,6 L40,4 L48,3 L56,2 L60,2',
  ],
  [
    'M0,12 L8,8 L16,10 L24,4 L32,6 L40,2 L48,4 L56,3 L60,1',
    'M0,14 L8,18 L16,10 L24,16 L32,8 L40,12 L48,6 L56,4 L60,2',
    'M0,20 L8,18 L16,16 L24,15 L32,12 L40,10 L48,8 L56,6 L60,4',
  ],
];

const protocols = [
  { name: 'ALEX', shortName: 'ALEX', color: 'hsl(33, 93%, 54%)' },
  { name: 'Velar', shortName: 'Velar', color: 'hsl(245, 100%, 64%)' },
  { name: 'Arkadiko', shortName: 'Arka', color: 'hsl(142, 71%, 45%)' },
  { name: 'StackingDAO', shortName: 'SDAO', color: 'hsl(38, 92%, 50%)' },
];

const chartColors = [
  { hue: 33, sat: 93, light: 54 },
  { hue: 28, sat: 90, light: 52 },
  { hue: 38, sat: 95, light: 56 },
  { hue: 30, sat: 88, light: 50 },
];

// Generate smooth area chart path
const chartPoints = Array.from({ length: 24 }, (_, i) => {
  const x = (i / 23) * 440;
  const y = 70 - (30 + Math.sin(i * 0.5) * 18 + Math.cos(i * 0.3) * 12 + Math.sin(i * 0.8) * 8);
  return `${x},${y}`;
});
const chartLine = `M${chartPoints.join(' L')}`;
const chartArea = `${chartLine} L440,90 L0,90 Z`;
const chartPathLength = 800;

const valueSets = [
  { values: ['$433,950', '+$10,190', '$9,187'], deltas: ['+2.4%', '+4.1%', '+1.8%'], alloc: ['38%', '27%', '22%', '13%'] },
  { values: ['$434,210', '+$10,450', '$9,203'], deltas: ['+2.5%', '+4.3%', '+1.9%'], alloc: ['39%', '26%', '22%', '13%'] },
  { values: ['$433,880', '+$9,870', '$9,195'], deltas: ['+2.3%', '+3.9%', '+1.8%'], alloc: ['37%', '28%', '22%', '13%'] },
  { values: ['$434,520', '+$10,680', '$9,221'], deltas: ['+2.6%', '+4.4%', '+2.0%'], alloc: ['38%', '27%', '23%', '12%'] },
];

const statMeta = [
  { icon: BarChart3, label: 'Total Value', spark: 0 },
  { icon: Zap, label: '24h Change', spark: 1 },
  { icon: Shield, label: 'Total Yield', spark: 2 },
];

export function Hero({ onLaunchApp, isConnecting }: HeroProps) {
  const [tickIndex, setTickIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTickIndex(prev => (prev + 1) % valueSets.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const current = valueSets[tickIndex];
  const cc = chartColors[tickIndex];
  const chartHsl = `hsl(${cc.hue}, ${cc.sat}%, ${cc.light}%)`;
  const chartHslFaded = (opacity: number) => `hsla(${cc.hue}, ${cc.sat}%, ${cc.light}%, ${opacity})`;
  const colorTransition = { transition: 'stroke 0.8s ease, fill 0.8s ease, stop-color 0.8s ease' };

  return (
    <section aria-label="Hero" className="relative min-h-screen flex items-center justify-center mesh-background overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-[orb-pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/5 blur-[100px] pointer-events-none animate-[orb-pulse_10s_ease-in-out_infinite_2s]" />

      <div className="container mx-auto px-4 sm:px-6 pt-20 pb-12 sm:pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium"
          >
            <Zap className="w-3.5 h-3.5" />
            Built for the Stacks Ecosystem
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
          >
            <span className="text-foreground">Your sBTC</span>{' '}
            <span className="gradient-text-orange">Portfolio</span>
            <br />
            <span className="text-foreground">Intelligence Platform</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Track, analyze, and optimize your sBTC positions across every protocol
            on Stacks. Real-time yield aggregation meets institutional-grade analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center"
          >
            <button
              onClick={onLaunchApp}
              disabled={isConnecting}
              className="btn-primary-gradient inline-flex items-center gap-2 text-base px-8 py-3.5 disabled:opacity-70"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>


          {/* Premium Dashboard Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 sm:mt-12 relative perspective-card"
          >
            <div className="glass-card p-4 sm:p-6 max-w-3xl mx-auto animate-[float_6s_ease-in-out_infinite]">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
                </div>
                <div className="h-7 bg-muted/60 rounded-lg flex-1 max-w-xs flex items-center px-3 gap-2">
                  <div className="w-3 h-3 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                    <Shield className="w-1.5 h-1.5 text-success" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">stackradar.app/dashboard</span>
                </div>
              </div>

              {/* Stat cards with sparklines */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                {statMeta.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                    className="bg-surface-2 rounded-lg p-3 sm:p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <item.icon className="w-3 h-3" />
                        <span className="text-[9px] sm:text-[11px] uppercase tracking-wider truncate">{item.label}</span>
                      </div>
                      <svg width="48" height="16" viewBox="0 0 60 20" className="opacity-50">
                        <AnimatePresence mode="wait">
                          <motion.path
                            key={tickIndex}
                            d={sparklineSets[tickIndex][item.spark]}
                            fill="none"
                            stroke="hsl(142, 71%, 45%)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="100"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </AnimatePresence>
                      </svg>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className="font-mono font-bold text-foreground text-sm sm:text-lg leading-none overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={current.values[i]}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="inline-block"
                          >
                            {current.values[i]}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <span className="bg-success/15 text-success text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={current.deltas[i]}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="inline-block"
                          >
                            {current.deltas[i]}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* SVG Area Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="bg-surface-2 rounded-lg p-4 sm:p-5 mb-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Portfolio Performance</span>
                  </div>
                  <div className="flex gap-1">
                    {['1D', '1W', '1M', '3M'].map((r, i) => (
                      <span
                        key={r}
                        className={`text-[8px] sm:text-[10px] px-2 py-0.5 rounded-md font-medium ${i === 2 ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <svg viewBox="0 0 440 100" className="w-full h-24 sm:h-32">
                  <defs>
                    <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: chartHsl, stopOpacity: 0.25, ...colorTransition }} />
                      <stop offset="100%" style={{ stopColor: chartHsl, stopOpacity: 0, ...colorTransition }} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {[20, 40, 60, 80].map(y => (
                    <line key={y} x1="0" y1={y} x2="440" y2={y} stroke="hsl(240, 10%, 16%)" strokeWidth="0.5" />
                  ))}
                  <motion.path
                    d={chartArea}
                    fill="url(#heroChartGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.3 }}
                  />
                  <motion.path
                    d={chartLine}
                    fill="none"
                    stroke={chartHsl}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    style={colorTransition}
                    strokeDasharray={chartPathLength}
                    initial={{ strokeDashoffset: chartPathLength }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.5, delay: 1.1, ease: 'easeOut' }}
                  />
                  <motion.circle
                    cx={chartPoints[chartPoints.length - 1].split(',')[0]}
                    cy={chartPoints[chartPoints.length - 1].split(',')[1]}
                    r="3"
                    fill={chartHsl}
                    style={colorTransition}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 2.6 }}
                  />
                  <motion.circle
                    cx={chartPoints[chartPoints.length - 1].split(',')[0]}
                    cy={chartPoints[chartPoints.length - 1].split(',')[1]}
                    r="6"
                    fill="none"
                    stroke={chartHsl}
                    strokeWidth="1"
                    style={colorTransition}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 2.6 }}
                  />
                </svg>
              </motion.div>

              {/* Protocol indicators */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.4 }}
                className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between px-1"
              >
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Allocation</span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:items-center sm:gap-5">
                  {protocols.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-[9px] sm:text-[11px] text-muted-foreground font-mono">
                        <span className="sm:hidden">{p.shortName}</span>
                        <span className="hidden sm:inline">{p.name}</span>
                      </span>
                      <span className="text-[9px] sm:text-[11px] text-foreground font-mono font-semibold overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={current.alloc[i]}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="inline-block"
                          >
                            {current.alloc[i]}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Enhanced multi-layer glow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-secondary/10 blur-[60px] rounded-full pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
