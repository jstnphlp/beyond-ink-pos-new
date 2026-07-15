import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchActivityLogs } from '@/shared/api/audit-log'

export const auditLogKeys = {
  all: ['activity-log'] as const,
}

export function useActivityLogs(limit = 50) {
  return useQuery({
    queryKey: auditLogKeys.all,
    queryFn: () => fetchActivityLogs(limit),
    staleTime: 10_000,
  })
}

export function useInvalidateActivityLog() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
}
