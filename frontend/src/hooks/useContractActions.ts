/**
 * StackRadar Contract Action Hooks
 * 
 * React hooks for executing contract write operations with transaction tracking
 */

import { useState, useCallback } from 'react';
import { useWallet } from './useStacksWallet';
import { useToast } from './use-toast';
import {
  registerUser,
  addPosition,
  updatePositionValue,
  closePosition,
  reopenPosition,
  recordSnapshot,
  registerProtocol,
  startTracking,
  stopTracking,
  claimYield,
  claimAllYield,
  AddPositionParams,
  UpdatePositionParams,
  StartTrackingParams,
  RegisterProtocolParams,
  TransactionResult,
} from '@/lib/stacks/write';
import { API_BASE_URL } from '@/lib/stacks/contracts';

// ============================================
// TYPES
// ============================================

interface ActionState {
  isLoading: boolean;
  error: Error | null;
  txId: string | null;
}

interface ActionResult {
  state: ActionState;
  reset: () => void;
}

// ============================================
// HELPER: WAIT FOR TRANSACTION
// ============================================

/**
 * Poll for transaction status until confirmed or failed
 */
export async function waitForTransaction(txId: string, maxAttempts = 60): Promise<boolean> {
  const url = `${API_BASE_URL}/extended/v1/tx/${txId}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.tx_status === 'success') {
        return true;
      }
      
      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        return false;
      }
      
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error polling transaction:', error);
    }
  }
  
  return false;
}

/**
 * Get transaction explorer URL
 */
export function getExplorerUrl(txId: string): string {
  return `https://explorer.hiro.so/txid/${txId}?chain=testnet`;
}

// ============================================
// ACTION HOOK FACTORY
// ============================================

type ActionFn<TParams> = TParams extends void 
  ? () => Promise<TransactionResult> 
  : (params: TParams) => Promise<TransactionResult>;

type ExecuteFn<TParams> = TParams extends void 
  ? () => Promise<boolean> 
  : (params: TParams) => Promise<boolean>;

function useContractAction<TParams = void>(
  actionFn: ActionFn<TParams>,
  successMessage: string,
  onSuccess?: () => void
): ActionResult & { execute: ExecuteFn<TParams> } {
  const { connected } = useWallet();
  const { toast } = useToast();
  const [state, setState] = useState<ActionState>({
    isLoading: false,
    error: null,
    txId: null,
  });

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, txId: null });
  }, []);

  const execute = useCallback(async (params?: TParams): Promise<boolean> => {
    if (!connected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to continue',
        variant: 'destructive',
      });
      return false;
    }

    setState({ isLoading: true, error: null, txId: null });

    try {
      const result = await (params !== undefined 
        ? (actionFn as (params: TParams) => Promise<TransactionResult>)(params)
        : (actionFn as () => Promise<TransactionResult>)());
      
      setState({ isLoading: false, error: null, txId: result.txId });
      
      toast({
        title: 'Transaction submitted',
        description: `TX: ${result.txId.slice(0, 10)}... View on explorer`,
      });

      // Optionally wait for confirmation
      const confirmed = await waitForTransaction(result.txId);
      
      if (confirmed) {
        toast({
          title: successMessage,
          description: 'Transaction confirmed on-chain',
        });
        onSuccess?.();
        return true;
      } else {
        toast({
          title: 'Transaction failed',
          description: 'The transaction was not confirmed',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Contract action error:', error);
      setState({ isLoading: false, error: error as Error, txId: null });
      
      toast({
        title: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [connected, actionFn, toast, successMessage, onSuccess]);

  return {
    state,
    reset,
    execute: execute as ExecuteFn<TParams>,
  };
}

// ============================================
// USER REGISTRATION
// ============================================

/**
 * Hook for registering a new user
 */
export function useRegisterUser(onSuccess?: () => void) {
  return useContractAction(registerUser, 'Successfully registered!', onSuccess);
}

// ============================================
// POSITION ACTIONS
// ============================================

/**
 * Hook for adding a new position
 */
export function useAddPosition(onSuccess?: () => void) {
  return useContractAction<AddPositionParams>(addPosition, 'Position added!', onSuccess);
}

/**
 * Hook for updating a position value
 */
export function useUpdatePosition(onSuccess?: () => void) {
  return useContractAction<UpdatePositionParams>(updatePositionValue, 'Position updated!', onSuccess);
}

/**
 * Hook for closing a position
 */
export function useClosePosition(onSuccess?: () => void) {
  return useContractAction<number>(closePosition, 'Position closed!', onSuccess);
}

/**
 * Hook for reopening a position
 */
export function useReopenPosition(onSuccess?: () => void) {
  return useContractAction<number>(reopenPosition, 'Position reopened!', onSuccess);
}

/**
 * Hook for recording a snapshot
 */
export function useRecordSnapshot(onSuccess?: () => void) {
  return useContractAction(recordSnapshot, 'Snapshot recorded!', onSuccess);
}

// ============================================
// PROTOCOL ACTIONS (OWNER ONLY)
// ============================================

/**
 * Hook for registering a new protocol
 */
export function useRegisterProtocol(onSuccess?: () => void) {
  return useContractAction<RegisterProtocolParams>(registerProtocol, 'Protocol registered!', onSuccess);
}

// ============================================
// YIELD TRACKING ACTIONS
// ============================================

/**
 * Hook for starting yield tracking
 */
export function useStartTracking(onSuccess?: () => void) {
  return useContractAction<StartTrackingParams>(startTracking, 'Now tracking yield!', onSuccess);
}

/**
 * Hook for stopping yield tracking
 */
export function useStopTracking(onSuccess?: () => void) {
  return useContractAction<number>(stopTracking, 'Stopped tracking!', onSuccess);
}

/**
 * Hook for claiming yield from a source
 */
export function useClaimYield(onSuccess?: () => void) {
  return useContractAction<number>(claimYield, 'Yield claimed!', onSuccess);
}

/**
 * Hook for claiming all yield
 */
export function useClaimAllYield(onSuccess?: () => void) {
  return useContractAction(claimAllYield, 'All yield claimed!', onSuccess);
}

// ============================================
// COMBINED ACTIONS
// ============================================

/**
 * Hook that combines registration check with action
 * Registers user first if not registered, then executes action
 */
export function useAutoRegisterAction<TParams>(
  isRegistered: boolean,
  actionFn: (params: TParams) => Promise<TransactionResult>,
  successMessage: string,
  onSuccess?: () => void
) {
  const registerAction = useRegisterUser();
  const mainAction = useContractAction<TParams>(
    actionFn as ActionFn<TParams>, 
    successMessage, 
    onSuccess
  );
  
  const execute = useCallback(async (params: TParams): Promise<boolean> => {
    if (!isRegistered) {
      const registered = await registerAction.execute();
      if (!registered) {
        return false;
      }
    }
    
    return mainAction.execute(params);
  }, [isRegistered, registerAction, mainAction]);

  return {
    state: {
      isLoading: registerAction.state.isLoading || mainAction.state.isLoading,
      error: registerAction.state.error || mainAction.state.error,
      txId: mainAction.state.txId || registerAction.state.txId,
    },
    execute,
    reset: () => {
      registerAction.reset();
      mainAction.reset();
    },
  };
}
