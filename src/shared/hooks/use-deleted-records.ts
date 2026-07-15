import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchDeletedRecords,
  fetchDistinctTableNames,
  restoreDeletedRecord,
} from '@/shared/api/deleted-records'

export const trashKeys = {
  all: ['trash'] as const,
  list: (tableName?: string) =>
    tableName
      ? ([...trashKeys.all, tableName] as const)
      : ([...trashKeys.all, 'all'] as const),
  tableNames: () => [...trashKeys.all, 'table-names'] as const,
}

export function useDeletedRecords(
  tableName?: string,
  page = 0,
  pageSize = 20
) {
  return useQuery({
    queryKey: [...trashKeys.list(tableName), page],
    queryFn: () =>
      fetchDeletedRecords({
        tableName,
        limit: pageSize,
        offset: page * pageSize,
      }),
  })
}

export function useDistinctTableNames() {
  return useQuery({
    queryKey: trashKeys.tableNames(),
    queryFn: fetchDistinctTableNames,
    staleTime: 60_000,
  })
}

export function useRestoreDeletedRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableName, recordId }: { tableName: string; recordId: string }) =>
      restoreDeletedRecord(tableName, recordId),
    onSuccess: () => {
      toast.success('Record restored successfully')
      queryClient.invalidateQueries({ queryKey: trashKeys.all })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to restore record')
    },
  })
}
