import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchActivityLogs } from '@/shared/api/audit-log'

const PAGE_SIZE = 10

export const auditLogKeys = {
  all: ['activity-log'] as const,
  page: (page: number) => [...auditLogKeys.all, page] as const,
}

export function useActivityLogs(page = 0) {
  return useQuery({
    queryKey: auditLogKeys.page(page),
    queryFn: () => fetchActivityLogs(PAGE_SIZE, page * PAGE_SIZE),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  })
}

export function useInvalidateActivityLog() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
}
