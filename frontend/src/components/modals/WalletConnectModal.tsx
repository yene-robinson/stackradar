import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle, AlertCircle, RotateCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useStacksWallet';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const navigate = useNavigate();
  const { connect, isLoading, error: walletError, connected } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);
  const [waitingForPopup, setWaitingForPopup] = useState(false);

  // If already connected when modal opens, show success
  useEffect(() => {
    if (open && connected && !justConnected) {
      setJustConnected(true);
      setTimeout(() => {
        onOpenChange(false);
        setJustConnected(false);
        navigate('/dashboard');
      }, 800);
    }
  }, [open, connected, justConnected, navigate, onOpenChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setLocalError(null);
    setWaitingForPopup(true);

    try {
      // This will open the Stacks wallet popup
      await connect();
      setWaitingForPopup(false);
      setJustConnected(true);
      toast.success('Connected to wallet');
      setTimeout(() => {
        onOpenChange(false);
        setJustConnected(false);
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      console.error('Connection error:', err);
      setWaitingForPopup(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setLocalError(errorMessage);
      
      // Show helpful message for common errors
      if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
        toast.error('Popup blocked', {
          description: 'Please allow popups for this site to connect your wallet',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const error = localError || (walletError ? walletError : null);
  const showConnected = justConnected || (connected && !isConnecting);

  return (
    <Dialog open={open} onOpenChange={(v) => { 
      onOpenChange(v); 
      if (!v) { 
        setLocalError(null); 
        setJustConnected(false);
        setWaitingForPopup(false);
      } 
    }}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Connect Wallet</DialogTitle>
          <DialogDescription>Connect your Stacks wallet to use StackRadar</DialogDescription>
        </DialogHeader>
        {showConnected ? (
          <div className="flex flex-col items-center gap-3 py-8" aria-live="assertive">
            <CheckCircle className="w-12 h-12 text-success" />
            <p className="text-sm font-medium text-foreground">Connected successfully!</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive flex-1">{error}</p>
                <button onClick={() => setLocalError(null)} className="text-xs text-destructive hover:underline font-medium flex items-center gap-1">
                  <RotateCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                {waitingForPopup ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Waiting for wallet...</p>
                    <p className="text-xs text-muted-foreground">
                      A popup should appear. If you don't see it, check if popups are blocked.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your Stacks wallet (Leather, Xverse, or Hiro) to track your sBTC positions and yield.
                    </p>
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting || isLoading}
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all disabled:opacity-50"
                    >
                      {(isConnecting || isLoading) ? (
                        <>
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          <span className="text-sm font-medium text-foreground">Connecting...</span>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-foreground">Connect Wallet</span>
                      )}
                    </button>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground text-center">
                  Supports Leather, Xverse, and Hiro wallets.
                  <br />
                  <span className="text-primary">Testnet only</span> - Make sure your wallet is on testnet.
                </p>
                <p className="text-[11px] text-center">
                  <a 
                    href="https://leather.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    Don't have a wallet? Get Leather <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center pt-3 border-t border-border/30">
              By connecting, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
