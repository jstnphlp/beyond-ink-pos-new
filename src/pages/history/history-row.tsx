import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { HistoryTransaction } from '@/shared/api/history.types'

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
}

function formatDate(iso: string) {
  return (
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' · ' +
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  )
}

export const HistoryRow = memo(function HistoryRow({
  txn,
  onSelect,
}: {
  txn: HistoryTransaction
  onSelect: (id: string) => void
}) {
  return (
    <div
      className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg cursor-pointer"
      onClick={() => onSelect(txn.id)}
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">
            TXN-{txn.transactionNumber.slice(-4)}
          </p>
          <Badge
            variant="outline"
            className={`border text-[10px] font-semibold uppercase ${STATUS_STYLES[txn.status]}`}
          >
            {txn.status}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {txn.customerName || 'Walk-in'} · {txn.paymentMethod === 'gcash' ? 'GCash' : 'Cash'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">
          ₱{txn.finalTotal.toLocaleString()}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatDate(txn.completedAt || txn.createdAt)}
        </p>
      </div>
    </div>
  )
})
