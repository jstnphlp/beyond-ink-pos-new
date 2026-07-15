import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchWalletSummary,
  fetchWalletTransactions,
  fetchWalletCategories,
  createWalletCategory,
  fetchWalletEntries,
  createWalletEntry,
  deleteWalletEntry,
  setWalletBalanceOverride,
  clearWalletBalanceOverride,
} from '@/shared/api/wallet'
import type { CreateWalletEntryInput, WalletEntry } from '@/shared/api/wallet'
import { logActivity } from '@/shared/api/audit-log'
import { auditLogKeys } from './use-audit-log'

export const walletKeys = {
  all: ['wallet'] as const,
  summary: () => [...walletKeys.all, 'summary'] as const,
  transactions: () => [...walletKeys.all, 'transactions'] as const,
  categories: () => [...walletKeys.all, 'categories'] as const,
  entries: (paymentMethod?: string) =>
    paymentMethod
      ? [...walletKeys.all, 'entries', paymentMethod] as const
      : [...walletKeys.all, 'entries'] as const,
}

export function useWalletSummary() {
  return useQuery({
    queryKey: walletKeys.summary(),
    queryFn: fetchWalletSummary,
    refetchInterval: 30_000,
  })
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: walletKeys.transactions(),
    queryFn: fetchWalletTransactions,
    refetchInterval: 30_000,
  })
}

export function useWalletCategories() {
  return useQuery({
    queryKey: walletKeys.categories(),
    queryFn: fetchWalletCategories,
    staleTime: 5 * 60_000,
  })
}

export function useWalletEntries(paymentMethod?: 'cash' | 'gcash') {
  return useQuery({
    queryKey: walletKeys.entries(paymentMethod),
    queryFn: () => fetchWalletEntries(paymentMethod),
    staleTime: 30_000,
  })
}

export function useCreateWalletEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entry: CreateWalletEntryInput & { performedBy: string }) =>
      createWalletEntry(entry).then(async (result) => {
        await logActivity({
          action: entry.type === 'income' ? 'income_added' : 'expense_added',
          performedBy: entry.performedBy,
          paymentMethod: entry.paymentMethod,
          amount: entry.amount,
          description: entry.description,
        }).catch(() => {})
        return result
      }),
    onSuccess: () => {
      toast.success('Entry added')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
      queryClient.invalidateQueries({ queryKey: walletKeys.entries() })
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
    },
    onError: () => {
      toast.error('Failed to add entry')
    },
  })
}

export function useDeleteWalletEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, entry, performedBy }: { id: string; entry?: WalletEntry; performedBy: string }) =>
      deleteWalletEntry(id).then(async () => {
        await logActivity({
          action: 'entry_deleted',
          performedBy,
          paymentMethod: entry?.paymentMethod,
          amount: entry?.amount,
          description: entry?.description,
        }).catch(() => {})
      }),
    onSuccess: () => {
      toast.success('Entry deleted')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
      queryClient.invalidateQueries({ queryKey: walletKeys.entries() })
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
    },
    onError: () => {
      toast.error('Failed to delete entry')
    },
  })
}

export function useCreateWalletCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createWalletCategory(name),
    onSuccess: () => {
      toast.success('Category created')
      queryClient.invalidateQueries({ queryKey: walletKeys.categories() })
    },
    onError: () => {
      toast.error('Failed to create category')
    },
  })
}

export function useSetBalanceOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentMethod, amount, performedBy }: { paymentMethod: 'cash' | 'gcash'; amount: number; performedBy: string }) =>
      setWalletBalanceOverride(paymentMethod, amount).then(async () => {
        await logActivity({
          action: 'balance_override_set',
          performedBy,
          paymentMethod,
          amount,
          description: `Set ${paymentMethod} balance to ₱${amount.toLocaleString()}`,
        }).catch(() => {})
      }),
    onSuccess: () => {
      toast.success('Balance override saved')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
    },
    onError: () => {
      toast.error('Failed to save override')
    },
  })
}

export function useClearBalanceOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentMethod, performedBy }: { paymentMethod: 'cash' | 'gcash'; performedBy: string }) =>
      clearWalletBalanceOverride(paymentMethod).then(async () => {
        await logActivity({
          action: 'balance_override_cleared',
          performedBy,
          paymentMethod,
          description: `Cleared ${paymentMethod} balance override`,
        }).catch(() => {})
      }),
    onSuccess: () => {
      toast.success('Override cleared')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
    },
    onError: () => {
      toast.error('Failed to clear override')
    },
  })
}
