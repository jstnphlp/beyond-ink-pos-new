import { usePosStore } from '@/stores/pos-store'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Banknote, Smartphone, ArrowDownLeft, Hash } from 'lucide-react'

export function StepPayment() {
  const {
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,
    gcashRef,
    setGcashRef,
    getTotal,
    getChangeDue,
  } = usePosStore()

  const total = getTotal()
  const changeDue = getChangeDue()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Payment</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select a payment method and complete the transaction.
        </p>
      </div>

      {/* Amount Due Banner */}
      <div className="rounded-xl border border-border/60 bg-card p-5 text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Amount Due
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          ₱{total.toLocaleString()}
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cash */}
        <button
          type="button"
          onClick={() => setPaymentMethod('cash')}
          className={cn(
            'group relative flex flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-200',
            paymentMethod === 'cash'
              ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
              : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
          )}
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
              paymentMethod === 'cash'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-muted text-muted-foreground group-hover:text-foreground'
            )}
          >
            <Banknote className="h-7 w-7" />
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              paymentMethod === 'cash'
                ? 'text-emerald-400'
                : 'text-foreground'
            )}
          >
            Cash
          </span>
        </button>

        {/* GCash */}
        <button
          type="button"
          onClick={() => setPaymentMethod('gcash')}
          className={cn(
            'group relative flex flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-200',
            paymentMethod === 'gcash'
              ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20'
              : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
          )}
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
              paymentMethod === 'gcash'
                ? 'bg-blue-500/15 text-blue-400'
                : 'bg-muted text-muted-foreground group-hover:text-foreground'
            )}
          >
            <Smartphone className="h-7 w-7" />
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              paymentMethod === 'gcash' ? 'text-blue-400' : 'text-foreground'
            )}
          >
            GCash
          </span>
        </button>
      </div>

      {/* Cash Received + Change */}
      {paymentMethod === 'cash' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Banknote className="h-3 w-3" />
              Cash Received (₱)
            </label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={cashReceived || ''}
              onChange={(e) =>
                setCashReceived(parseFloat(e.target.value) || 0)
              }
              onWheel={(e) => e.currentTarget.blur()}
              className="input-numeric border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
          </div>

          {/* Change Due */}
          {cashReceived > 0 && (
            <div
              className={cn(
                'rounded-xl border p-5 text-center transition-all',
                cashReceived >= total
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-destructive/30 bg-destructive/5'
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <ArrowDownLeft
                  className={cn(
                    'h-4 w-4',
                    cashReceived >= total
                      ? 'text-emerald-400'
                      : 'text-destructive'
                  )}
                />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {cashReceived >= total ? 'Change Due' : 'Insufficient'}
                </span>
              </div>
              <p
                className={cn(
                  'mt-1 text-3xl font-bold tracking-tight tabular-nums',
                  cashReceived >= total
                    ? 'text-emerald-400'
                    : 'text-destructive'
                )}
              >
                ₱{changeDue.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* GCash Reference */}
      {paymentMethod === 'gcash' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Hash className="h-3 w-3" />
              GCash Reference Number
            </label>
            <Input
              placeholder="Enter reference number"
              value={gcashRef}
              onChange={(e) => setGcashRef(e.target.value)}
              className="h-12 text-base font-semibold tracking-wider"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  )
}
