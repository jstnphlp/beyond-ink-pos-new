import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCostProfiles,
  upsertCostProfile,
  deleteCostProfile,
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  replaceQuote,
  deleteQuote,
  getMarginThresholds,
  updateMarginThresholds,
  importCostProfiles,
} from '@/shared/api/costing'
import type {
  CostProfileInput,
  CreateQuoteInput,
  MarginThresholds,
} from '@/shared/api/costing.types'

export const costingKeys = {
  all: ['costing'] as const,
  profiles: () => [...costingKeys.all, 'profiles'] as const,
  quotes: () => [...costingKeys.all, 'quotes'] as const,
  quote: (id: string) => [...costingKeys.all, 'quote', id] as const,
  thresholds: () => [...costingKeys.all, 'thresholds'] as const,
}

export function useCostProfiles() {
  return useQuery({
    queryKey: costingKeys.profiles(),
    queryFn: getCostProfiles,
    staleTime: 5 * 60_000,
  })
}

export function useUpsertCostProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CostProfileInput) => upsertCostProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.profiles() })
      toast.success('Cost profile saved')
    },
    onError: () => toast.error('Failed to save cost profile'),
  })
}

export function useDeleteCostProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCostProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.profiles() })
      toast.success('Cost profile deleted')
    },
    onError: () => toast.error('Failed to delete cost profile'),
  })
}

export function useQuotes() {
  return useQuery({
    queryKey: costingKeys.quotes(),
    queryFn: getQuotes,
    staleTime: 2 * 60_000,
  })
}

export function useQuote(id: string | null) {
  return useQuery({
    queryKey: costingKeys.quote(id ?? ''),
    queryFn: () => getQuote(id!),
    enabled: !!id,
    staleTime: 2 * 60_000,
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateQuoteInput) => createQuote(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.quotes() })
      toast.success('Quote created')
    },
    onError: () => toast.error('Failed to create quote'),
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{ name: string; notes: string }>
    }) => updateQuote(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.quotes() })
      toast.success('Quote updated')
    },
    onError: () => toast.error('Failed to update quote'),
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.quotes() })
      toast.success('Quote deleted')
    },
    onError: () => toast.error('Failed to delete quote'),
  })
}

export function useReplaceQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateQuoteInput }) =>
      replaceQuote(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.quotes() })
      toast.success('Quote updated')
    },
    onError: () => toast.error('Failed to update quote'),
  })
}

export function useMarginThresholds() {
  return useQuery({
    queryKey: costingKeys.thresholds(),
    queryFn: getMarginThresholds,
    staleTime: 10 * 60_000,
  })
}

export function useUpdateMarginThresholds() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MarginThresholds) => updateMarginThresholds(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.thresholds() })
      toast.success('Thresholds updated')
    },
    onError: () => toast.error('Failed to update thresholds'),
  })
}

export function useImportCostProfiles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: CostProfileInput[]) => importCostProfiles(rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: costingKeys.profiles() })
      toast.success('Cost profiles imported')
    },
    onError: () => toast.error('Failed to import cost profiles'),
  })
}
