import { useState, useEffect } from 'react';
import { Zap, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LandingHeaderProps {
  onLaunchApp?: () => void;
  isConnecting?: boolean;
}

export function LandingHeader({ onLaunchApp, isConnecting }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      {/* Testnet Banner - Fixed at very top */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-yellow-500/10 via-yellow-500/15 to-yellow-500/10 border-b border-yellow-500/20 py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-xs sm:text-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-yellow-400 font-semibold">TESTNET</span>
          <span className="hidden sm:inline text-yellow-500/60">|</span>
          <span className="hidden sm:inline text-yellow-500/80">Running on Stacks testnet. Tokens have no real value.</span>
        </div>
      </div>

      {/* Main Header - Below banner */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        aria-label="Site header"
        className={cn(
          'fixed top-[34px] left-0 right-0 z-50 transition-all duration-300 border-b',
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-border/50'
            : 'bg-transparent border-transparent'
        )}
      >
      <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            Stack<span className="text-primary">Radar</span>
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Stats
          </a>
        </nav>

        <button
          onClick={onLaunchApp}
          disabled={isConnecting}
          className="btn-primary-gradient text-sm flex items-center gap-2 disabled:opacity-70"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Launch App'
          )}
        </button>
      </div>
    </motion.header>
    </>
  );
}
