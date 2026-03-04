/**
 * BNS-aware Address Display Component
 * Shows BNS name if available, otherwise truncated address
 */

import { cn } from '@/lib/utils';
import { useBNSName } from '@/hooks/useBNS';
import { AtSign } from 'lucide-react';

interface AddressDisplayProps {
  address: string;
  className?: string;
  showIcon?: boolean;
  truncateLength?: number;
  prefix?: string; // e.g., "To:" or "From:"
}

export function AddressDisplay({
  address,
  className,
  showIcon = false,
  truncateLength = 8,
  prefix,
}: AddressDisplayProps) {
  const { displayName, hasName, loading } = useBNSName(address);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        loading && "animate-pulse",
        className
      )}
    >
      {prefix && <span>{prefix}</span>}
      {showIcon && hasName && <AtSign className="w-3 h-3 text-primary" />}
      <span className={hasName ? "font-medium" : "font-mono"}>
        {displayName}
      </span>
    </span>
  );
}

interface AddressAvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AddressAvatar({ address, size = 'md', className }: AddressAvatarProps) {
  const { hasName } = useBNSName(address);
  
  const sizeClass = {
    sm: 'w-6 h-6 text-[8px]',
    md: 'w-8 h-8 text-[10px]',
    lg: 'w-10 h-10 text-xs',
  };

  // Generate a color from the address
  const color = `hsl(${parseInt(address.slice(2, 8), 16) % 360}, 60%, 60%)`;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-mono font-bold",
        sizeClass[size],
        hasName ? "bg-primary/20 text-primary" : "bg-muted",
        className
      )}
      style={{ backgroundColor: hasName ? undefined : `${color}20`, color: hasName ? undefined : color }}
    >
      {hasName ? (
        <AtSign className="w-1/2 h-1/2" />
      ) : (
        address.slice(0, 2)
      )}
    </div>
  );
}
