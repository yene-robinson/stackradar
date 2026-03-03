import { LucideIcon, WifiOff, AlertTriangle, Wallet, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

const variantDefaults = {
  connection: {
    icon: WifiOff,
    title: 'Connection Failed',
    description: 'Unable to reach the server. Check your internet connection and try again.',
  },
  network: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred while loading data.',
  },
  wallet: {
    icon: Wallet,
    title: 'Wallet not connected',
    description: 'Connect your wallet to view your portfolio and positions.',
  },
};

interface ErrorStateProps {
  variant: 'connection' | 'network' | 'wallet';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onRetry?: () => void;
}

export function ErrorState({ variant, title, description, actionLabel, onAction, onRetry }: ErrorStateProps) {
  const defaults = variantDefaults[variant];
  const Icon: LucideIcon = defaults.icon;
  const displayTitle = title ?? defaults.title;
  const displayDescription = description ?? defaults.description;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <Icon className="w-7 h-7 text-destructive" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{displayDescription}</p>
      </div>
      <div className="flex items-center gap-3 mt-2">
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary-ghost text-sm px-4 py-2 flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5" /> Try Again
          </button>
        )}
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn-primary-gradient text-sm px-5 py-2">
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
