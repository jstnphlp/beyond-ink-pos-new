import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, ChevronLeft, ChevronRight, Receipt } from 'lucide-react'
import { HistoryRow } from './history-row'
import type { HistoryTransaction } from '@/shared/api/history.types'

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3.5 px-2">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-32 ml-auto" />
      </div>
    </div>
  )
}

export function HistoryList({
  transactions,
  isLoading,
  isFetching,
  hasNextPage,
  hasPrevPage,
  pageIndex,
  onNext,
  onPrev,
  onPrefetchNext,
  onSelectTransaction,
}: {
  transactions: HistoryTransaction[]
  isLoading: boolean
  isFetching: boolean
  hasNextPage: boolean
  hasPrevPage: boolean
  pageIndex: number
  onNext: () => void
  onPrev: () => void
  onPrefetchNext: () => void
  onSelectTransaction: (id: string) => void
}) {
  useEffect(() => {
    if (hasNextPage) onPrefetchNext()
  }, [hasNextPage, onPrefetchNext])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-brand" />
          All Transactions
          {!isLoading && transactions.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              Page {pageIndex + 1}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-0 divide-y divide-border/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground/60">
              No transactions found
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/40">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <>
            <div
              className={`space-y-0 divide-y divide-border/40 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}
            >
              {transactions.map((txn) => (
                <HistoryRow
                  key={txn.id}
                  txn={txn}
                  onSelect={onSelectTransaction}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
              <p className="text-xs text-muted-foreground">
                Showing page {pageIndex + 1}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={!hasPrevPage}
                  onClick={onPrev}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={!hasNextPage}
                  onClick={onNext}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
