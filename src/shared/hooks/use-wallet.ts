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
import type { CreateWalletEntryInput } from '@/shared/api/wallet'

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
    mutationFn: (entry: CreateWalletEntryInput) => createWalletEntry(entry),
    onSuccess: () => {
      toast.success('Entry added')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
      queryClient.invalidateQueries({ queryKey: walletKeys.entries() })
    },
    onError: () => {
      toast.error('Failed to add entry')
    },
  })
}

export function useDeleteWalletEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteWalletEntry(id),
    onSuccess: () => {
      toast.success('Entry deleted')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
      queryClient.invalidateQueries({ queryKey: walletKeys.entries() })
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
    mutationFn: ({ paymentMethod, amount }: { paymentMethod: 'cash' | 'gcash'; amount: number }) =>
      setWalletBalanceOverride(paymentMethod, amount),
    onSuccess: () => {
      toast.success('Balance override saved')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
    },
    onError: () => {
      toast.error('Failed to save override')
    },
  })
}

export function useClearBalanceOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentMethod: 'cash' | 'gcash') =>
      clearWalletBalanceOverride(paymentMethod),
    onSuccess: () => {
      toast.success('Override cleared')
      queryClient.invalidateQueries({ queryKey: walletKeys.summary() })
    },
    onError: () => {
      toast.error('Failed to clear override')
    },
  })
}
