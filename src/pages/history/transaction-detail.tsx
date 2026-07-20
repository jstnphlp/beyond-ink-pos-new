import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactionDetail } from './use-history-query'
import { X, CreditCard, Banknote, MapPin, Tag, User } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
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

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}

export function TransactionDetail({
  transactionId,
  onClose,
}: {
  transactionId: string | null
  onClose: () => void
}) {
  const { data: detail, isLoading } = useTransactionDetail(transactionId)

  return (
    <Dialog open={!!transactionId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogPopup className="fixed right-0 top-0 h-full w-full max-w-md translate-x-0 translate-y-0 left-auto rounded-none border-l [&[data-open]]:!animate-none [&[data-closed]]:!animate-none">
        <div className="flex items-center justify-between">
          <DialogTitle>
            {detail ? `TXN-${detail.transactionNumber.slice(-4)}` : 'Transaction'}
          </DialogTitle>
          <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        {isLoading || !detail ? (
          <DetailSkeleton />
        ) : (
          <div className="mt-6 space-y-6 overflow-y-auto">
            {/* Status & meta */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`border text-[10px] font-semibold uppercase ${STATUS_STYLES[detail.status]}`}
                >
                  {detail.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(detail.completedAt || detail.createdAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cashier: {detail.cashierName}
              </p>
            </div>

            {/* Customer */}
            {detail.customerName && (
              <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{detail.customerName}</p>
                  {detail.deliveryAddress && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {detail.deliveryAddress}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Service lines */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                Items
              </h4>
              <div className="space-y-3">
                {detail.serviceLines.map((line) => (
                  <div
                    key={line.id}
                    className="text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{line.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          × {line.quantity}
                        </p>
                      </div>
                      <p className="tabular-nums font-medium">
                        ₱{(line.unitPrice * line.quantity).toLocaleString()}
                      </p>
                    </div>
                    {line.materials.length > 0 && (
                      <div className="mt-1 space-y-0.5 pl-3">
                        {line.materials.map((mat, j) => (
                          <p key={j} className="text-xs text-muted-foreground">
                            {mat.materialName}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-border/40 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">₱{detail.subtotal.toLocaleString()}</span>
              </div>
              {detail.discountValue != null && detail.discountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    Discount
                    {detail.discountType === 'percentage'
                      ? ` (${detail.discountValue}%)`
                      : ''}
                  </span>
                  <span className="tabular-nums text-emerald-400">
                    -₱
                    {detail.discountType === 'percentage'
                      ? Math.round((detail.subtotal * detail.discountValue) / 100).toLocaleString()
                      : detail.discountValue.toLocaleString()}
                  </span>
                </div>
              )}
              {detail.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Delivery
                  </span>
                  <span className="tabular-nums">
                    ₱{detail.deliveryFee.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">
                  ₱{detail.finalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm">
                {detail.paymentMethod === 'gcash' ? (
                  <CreditCard className="h-4 w-4 text-blue-400" />
                ) : (
                  <Banknote className="h-4 w-4 text-emerald-400" />
                )}
                <span className="font-medium">
                  {detail.paymentMethod === 'gcash' ? 'GCash' : 'Cash'}
                </span>
              </div>
              {detail.paymentMethod === 'cash' && detail.cashReceived != null && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Cash received</span>
                    <span className="tabular-nums">
                      ₱{detail.cashReceived.toLocaleString()}
                    </span>
                  </div>
                  {detail.changeDue != null && detail.changeDue > 0 && (
                    <div className="flex justify-between">
                      <span>Change due</span>
                      <span className="tabular-nums">
                        ₱{detail.changeDue.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {detail.paymentMethod === 'gcash' && detail.gcashAmountPaid != null && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Amount paid</span>
                    <span className="tabular-nums">
                      ₱{detail.gcashAmountPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogPopup>
    </Dialog>
  )
}
