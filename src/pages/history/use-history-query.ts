import { useState, useCallback, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchHistoryPage, fetchTransactionDetail } from '@/shared/api/history'
import type { HistoryFilters, HistoryTransaction } from '@/shared/api/history.types'

const DEFAULT_FILTERS: HistoryFilters = {
  search: '',
  status: 'all',
  paymentMethod: 'all',
  dateFrom: null,
  dateTo: null,
}

export function useHistory() {
  const [pageIndex, setPageIndex] = useState(0)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS)
  const debouncedFiltersRef = useRef<HistoryFilters>(DEFAULT_FILTERS)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cursor = cursors[pageIndex] ?? null

  const stableFilters = useMemo(
    () => debouncedFiltersRef.current,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedFiltersRef.current.search, debouncedFiltersRef.current.status, debouncedFiltersRef.current.paymentMethod, debouncedFiltersRef.current.dateFrom, debouncedFiltersRef.current.dateTo]
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['history', stableFilters, cursor?.createdAt, cursor?.id],
    queryFn: () => fetchHistoryPage({ cursor, filters: stableFilters }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  })

  const queryClient = useQueryClient()

  const prefetchNext = useCallback(() => {
    if (!data?.nextCursor) return
    const nextFilters = stableFilters
    queryClient.prefetchQuery({
      queryKey: ['history', nextFilters, data.nextCursor.createdAt, data.nextCursor.id],
      queryFn: () => fetchHistoryPage({ cursor: data.nextCursor, filters: nextFilters }),
      staleTime: 60_000,
    })
  }, [data?.nextCursor, stableFilters, queryClient])

  const goNext = useCallback(() => {
    if (!data?.nextCursor) return
    setCursors((prev) => {
      const next = [...prev]
      next[pageIndex + 1] = data.nextCursor
      return next
    })
    setPageIndex((p) => p + 1)
  }, [data?.nextCursor, pageIndex])

  const goPrev = useCallback(() => {
    if (pageIndex <= 0) return
    setPageIndex((p) => p - 1)
  }, [pageIndex])

  const updateFilter = useCallback(
    <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value }
        return next
      })

      if (key === 'search') {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
          debouncedFiltersRef.current = { ...debouncedFiltersRef.current, [key]: value }
          setCursors([null])
          setPageIndex(0)
          // Force re-render by triggering a state update
          setFilters((prev) => ({ ...prev }))
        }, 300)
      } else {
        debouncedFiltersRef.current = { ...debouncedFiltersRef.current, [key]: value }
        setCursors([null])
        setPageIndex(0)
      }
    },
    []
  )

  const transactions: HistoryTransaction[] = data?.transactions ?? []
  const hasNextPage = !!data?.nextCursor
  const hasPrevPage = pageIndex > 0

  return {
    transactions,
    isLoading,
    isFetching,
    filters,
    updateFilter,
    pageIndex,
    hasNextPage,
    hasPrevPage,
    goNext,
    goPrev,
    prefetchNext,
  }
}

export function useTransactionDetail(id: string | null) {
  return useQuery({
    queryKey: ['transaction-detail', id],
    queryFn: () => fetchTransactionDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}
