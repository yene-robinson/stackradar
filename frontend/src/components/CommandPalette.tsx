import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { LayoutDashboard, Layers, TrendingUp, BarChart3, Plus, Wallet, Zap, Loader2 } from 'lucide-react';
import { useProtocols } from '@/hooks/useData';

interface CommandPaletteProps {
  onConnectWallet?: () => void;
  onAddPosition?: () => void;
}

export function CommandPalette({ onConnectWallet, onAddPosition }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: protocols, isLoading } = useProtocols();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const go = (path: string) => { navigate(path); setOpen(false); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</CommandItem>
          <CommandItem onSelect={() => go('/positions')}><Layers className="mr-2 h-4 w-4" /> Positions</CommandItem>
          <CommandItem onSelect={() => go('/yield')}><TrendingUp className="mr-2 h-4 w-4" /> Yield Explorer</CommandItem>
          <CommandItem onSelect={() => go('/analytics')}><BarChart3 className="mr-2 h-4 w-4" /> Analytics</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { onAddPosition?.(); setOpen(false); }}><Plus className="mr-2 h-4 w-4" /> Add Position</CommandItem>
          <CommandItem onSelect={() => { onConnectWallet?.(); setOpen(false); }}><Wallet className="mr-2 h-4 w-4" /> Connect Wallet</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Protocols">
          {isLoading ? (
            <CommandItem disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading protocols...</CommandItem>
          ) : (
            protocols.map(p => (
              <CommandItem key={p.id} onSelect={() => go('/positions')}>
                <div className="mr-2 w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center" style={{ background: `${p.color}30`, color: p.color }}>{p.icon}</div>
                {p.name}
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
