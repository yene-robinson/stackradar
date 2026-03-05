import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Command, Copy, Check, Wallet, LogOut, ExternalLink, RefreshCw, AtSign } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useWallet, formatAddress } from '@/hooks/useStacksWallet';
import { usePrices } from '@/hooks/usePrices';
import { useBNSName } from '@/hooks/useBNS';
import { PriceDisplay } from '@/components/PriceDisplay';
import { NotificationCenter } from '@/components/NotificationCenter';

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
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { 
    connected, 
    disconnect, 
    address, 
    stxBalanceFormatted, 
    sbtcBalanceFormatted,
    stxBalance,
    sbtcBalance,
    balancesLoading,
    faucetUrl,
    refreshBalances,
    getExplorerAddressUrl 
  } = useWallet();
  
  const { calculateUSDValue, formatUSD } = usePrices();
  const { name: bnsName, loading: bnsLoading, hasName } = useBNSName(address);

  const displayAddress = formatAddress(address);
  const displayName = hasName ? bnsName : displayAddress;
  
  // Show faucet link if STX balance is below 1 STX (1,000,000 microSTX)
  const needsFaucet = stxBalance < BigInt(1_000_000);
  
  // Calculate USD values for balances
  const stxAmountNum = Number(stxBalance) / 1_000_000;
  const sbtcAmountNum = Number(sbtcBalance) / 100_000_000;
  const stxUsdValue = calculateUSDValue(stxAmountNum, 'stx');
  const sbtcUsdValue = calculateUSDValue(sbtcAmountNum, 'sbtc');
  const totalUsdValue = stxUsdValue + sbtcUsdValue;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setWalletMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {/* Testnet Badge */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-yellow-500">TESTNET</span>
          </div>

          {/* Notification Center */}
          <NotificationCenter />

          {connected ? (
            <div className="flex items-center gap-2">
              {/* Live Price Ticker - Compact */}
              <div className="hidden md:block">
                <PriceDisplay variant="compact" />
              </div>

              {/* Wallet Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
                    {hasName ? <AtSign className="w-3.5 h-3.5" /> : 'SR'}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className={cn(
                      "text-xs text-foreground",
                      hasName ? "font-medium" : "font-mono",
                      bnsLoading && "animate-pulse"
                    )}>
                      {displayName}
                    </span>
                    <span className="text-[10px] text-primary font-medium">{formatUSD(totalUsdValue)}</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", walletMenuOpen && "rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {walletMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-background border border-border shadow-xl z-50">
                    {/* Balances Section */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">Your Balances</span>
                        <button
                          onClick={() => refreshBalances()}
                          className={cn(
                            "p-1 rounded text-muted-foreground hover:text-foreground transition-colors",
                            balancesLoading && "animate-spin"
                          )}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <Zap className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium">STX</span>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-sm font-mono", balancesLoading && "animate-pulse")}>
                              {stxBalanceFormatted}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{formatUSD(stxUsdValue)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-orange-400">₿</span>
                            </div>
                            <span className="text-sm font-medium">sBTC</span>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-sm font-mono", balancesLoading && "animate-pulse")}>
                              {sbtcBalanceFormatted}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{formatUSD(sbtcUsdValue)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total Value</span>
                        <span className="text-sm font-bold text-primary">{formatUSD(totalUsdValue)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      {/* Copy Address */}
                      <button
                        onClick={() => {
                          copy(address);
                          toast.success('Address copied!');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-sm">{copied ? 'Copied!' : 'Copy Address'}</span>
                      </button>

                      {/* View on Explorer */}
                      <a
                        href={getExplorerAddressUrl(address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">View on Explorer</span>
                      </a>

                      {/* Faucet Link */}
                      {needsFaucet && (
                        <a
                          href={faucetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary font-medium">Get Testnet STX</span>
                        </a>
                      )}

                      {/* Disconnect */}
                      <button
                        onClick={() => {
                          disconnect();
                          setWalletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
