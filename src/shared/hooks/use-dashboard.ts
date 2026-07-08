import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getDepartmentSummaries, getRecentTransactions } from '@/shared/api/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summaries: () => [...dashboardKeys.all, 'summaries'] as const,
  transactions: () => [...dashboardKeys.all, 'transactions'] as const,
}

export function useDepartmentSummaries() {
  return useQuery({
    queryKey: dashboardKeys.summaries(),
    queryFn: getDepartmentSummaries,
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  })
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: dashboardKeys.transactions(),
    queryFn: getRecentTransactions,
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  })
}
