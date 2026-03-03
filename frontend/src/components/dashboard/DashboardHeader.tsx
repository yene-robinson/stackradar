import { Bell, ChevronDown, Zap, Command, Copy, Check, Wallet, LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useWallet, formatAddress } from '@/hooks/useStacksWallet';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Positions', path: '/positions' },
  { label: 'Yield', path: '/yield' },
  { label: 'Analytics', path: '/analytics' },
];

interface DashboardHeaderProps {
  onConnectWallet?: () => void;
}

export function DashboardHeader({ onConnectWallet }: DashboardHeaderProps) {
  const location = useLocation();
  const { copy, copied } = useCopyToClipboard();
  const { connected, disconnect, address } = useWallet();

  const displayAddress = formatAddress(address);

  return (
    <header aria-label="Site header" className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Stack<span className="text-primary">Radar</span>
            </span>
          </NavLink>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            aria-label="Open command palette"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Command className="w-3 h-3" />K
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            onClick={() => toast.info('No new notifications')}
            className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
          </button>

          {connected ? (
            <div className="flex items-center gap-2">
              <button
                aria-label="Copy wallet address"
                onClick={() => copy(address)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
                  SR
                </div>
                <span className="text-sm font-mono text-muted-foreground hidden sm:flex items-center gap-1">
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span className="text-success">Copied!</span>
                    </>
                  ) : (
                    <>
                      {displayAddress}
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </span>
              </button>
              <button
                aria-label="Disconnect wallet"
                onClick={disconnect}
                className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-primary-gradient text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" /> Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
