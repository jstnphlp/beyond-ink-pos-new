import { useState, useCallback } from 'react'
import { useHistory } from './use-history-query'
import { HistoryFilters } from './history-filters'
import { HistoryList } from './history-list'
import { TransactionDetail } from './transaction-detail'

export function HistoryPage() {
  const {
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
  } = useHistory()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedId(null)
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse all past transactions and receipts.
        </p>
      </div>

      <HistoryFilters filters={filters} onFilterChange={updateFilter} />

      <HistoryList
        transactions={transactions}
        isLoading={isLoading}
        isFetching={isFetching}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        pageIndex={pageIndex}
        onNext={goNext}
        onPrev={goPrev}
        onPrefetchNext={prefetchNext}
        onSelectTransaction={handleSelect}
      />

      <TransactionDetail transactionId={selectedId} onClose={handleClose} />
    </div>
  )
}
