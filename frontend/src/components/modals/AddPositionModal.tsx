import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useProtocols } from '@/hooks/useData';
import { useAddPosition, useRegisterUser } from '@/hooks/useContractActions';
import { useIsRegistered } from '@/hooks/useContracts';
import { useWallet } from '@/hooks/useStacksWallet';
import type { Protocol } from '@/services/dataService';
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddPositionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const positionTypes = ['Lending', 'LP Pool', 'Staking', 'Vault'] as const;
type PositionType = typeof positionTypes[number];
const typeApys: Record<PositionType, number> = { Lending: 6.5, 'LP Pool': 12.4, Staking: 4.8, Vault: 8.2 };
const typeToContractType: Record<PositionType, 'LENDING' | 'LP' | 'STAKING' | 'VAULT'> = {
  'Lending': 'LENDING',
  'LP Pool': 'LP',
  'Staking': 'STAKING',
  'Vault': 'VAULT',
};

export function AddPositionModal({ open, onOpenChange }: AddPositionModalProps) {
  const { data: protocols, isLoading: protocolsLoading } = useProtocols();
  const { connected } = useWallet();
  const { data: isRegistered } = useIsRegistered();
  const registerAction = useRegisterUser();
  const addPositionAction = useAddPosition();

  const [step, setStep] = useState(0);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [selectedType, setSelectedType] = useState<PositionType | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => { 
    setStep(0); 
    setSelectedProtocol(null); 
    setSelectedType(null); 
    setAmount(''); 
    setIsSubmitting(false);
  };
  const close = () => { onOpenChange(false); setTimeout(reset, 300); };

  const handleConfirm = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedProtocol || !selectedType) return;

    setIsSubmitting(true);

    try {
      // Register user first if not registered
      if (!isRegistered) {
        const registered = await registerAction.execute();
        if (!registered) {
          setIsSubmitting(false);
          return;
        }
      }

      // Add the position
      const amountMicro = Math.floor(parseFloat(amount) * 100000000); // Convert to micro-sBTC
      const success = await addPositionAction.execute({
        protocolId: parseInt(selectedProtocol.id.replace('protocol-', '').replace(/\D/g, '') || '1'),
        positionType: typeToContractType[selectedType],
        amount: amountMicro,
        entryValue: amountMicro, // Using same value for simplicity
      });

      if (success) {
        setStep(4);
        setTimeout(close, 1500);
      }
    } catch (error) {
      console.error('Error creating position:', error);
      toast.error('Failed to create position');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Protocol', 'Type', 'Amount', 'Review', 'Done'];
  const isProcessing = isSubmitting || registerAction.state.isLoading || addPositionAction.state.isLoading;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) close(); else onOpenChange(true); }}>
      <DialogContent className="glass-card border-border/50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Position</DialogTitle>
          <DialogDescription>Step {Math.min(step + 1, 4)} of 4</DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 py-1" aria-live="polite" aria-atomic="true" aria-label={`Step ${Math.min(step + 1, 4)} of 4`}>
          {steps.slice(0, 4).map((_, i) => (
            <div key={i} className={cn('w-2 h-2 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>

        {/* Step 0: Select Protocol */}
        {step === 0 && (
          protocolsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {protocols.map(p => (
                <button key={p.id} onClick={() => { setSelectedProtocol(p); setStep(1); }} className="flex items-center gap-2.5 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono" style={{ background: `${p.color}20`, color: p.color }}>
                    {p.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.chain}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="space-y-2 pt-2">
            {positionTypes.map(t => (
              <button key={t} onClick={() => { setSelectedType(t); setStep(2); }} className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all">
                <span className="text-sm font-medium text-foreground">{t}</span>
                <span className="font-mono text-xs text-primary">{typeApys[t]}% APY</span>
              </button>
            ))}
            <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Amount (sBTC)</label>
              <div className="flex items-center gap-2">
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="flex-1 px-4 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
                <button onClick={() => setAmount('2.50')} className="px-3 py-2.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">MAX</button>
              </div>
              {amount && <p className="text-xs text-muted-foreground">≈ ${(parseFloat(amount || '0') * 63800).toLocaleString()} USD</p>}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <button onClick={() => setStep(3)} disabled={!amount || parseFloat(amount) <= 0} className="btn-primary-gradient text-xs px-4 py-2 flex items-center gap-1 disabled:opacity-50">
                Review <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && selectedProtocol && selectedType && (
          <div className="space-y-4 pt-2">
            <div className="glass-card p-4 space-y-3">
              {[
                { label: 'Protocol', value: selectedProtocol.name },
                { label: 'Type', value: selectedType },
                { label: 'Amount', value: `${amount} sBTC` },
                { label: 'USD Value', value: `$${(parseFloat(amount || '0') * 63800).toLocaleString()}` },
                { label: 'Est. APY', value: `${typeApys[selectedType]}%` },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} disabled={isProcessing} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <button onClick={handleConfirm} disabled={isProcessing} className="btn-primary-gradient text-xs px-6 py-2 flex items-center gap-1.5 disabled:opacity-50">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Position'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle className="w-12 h-12 text-success" />
            <p className="text-sm font-medium text-foreground">Position created!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
