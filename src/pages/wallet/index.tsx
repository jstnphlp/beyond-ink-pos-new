import { useQuery } from '@tanstack/react-query'
import { fetchWalletSummary, fetchWalletTransactions } from '@/shared/api/wallet'
import { cn } from '@/lib/utils'
import { Banknote, Smartphone, Wallet as WalletIcon } from 'lucide-react'

export function WalletPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['wallet-summary'],
    queryFn: fetchWalletSummary,
    refetchInterval: 30_000,
  })

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: fetchWalletTransactions,
    refetchInterval: 30_000,
  })

  if (loadingSummary) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <WalletIcon className="h-6 w-6 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  const cashTotal = summary?.cashTotal ?? 0
  const gcashTotal = summary?.gcashTotal ?? 0
  const combinedTotal = summary?.combinedTotal ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment balances from completed sales.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Cash */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Banknote className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400/80">Cash</p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                ₱{cashTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* GCash */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
              <Smartphone className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-400/80">GCash</p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                ₱{gcashTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Combined */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <WalletIcon className="h-4.5 w-4.5 text-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total</p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                ₱{combinedTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Recent Completed Sales
        </h2>
        {loadingTx ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (transactions ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed sales yet.</p>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Transaction</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(transactions ?? []).map((tx) => (
                  <tr key={tx.id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      #{tx.transactionNumber}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {tx.customerName || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          tx.paymentMethod === 'cash'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-400'
                        )}
                      >
                        {tx.paymentMethod === 'cash' ? (
                          <Banknote className="h-3 w-3" />
                        ) : (
                          <Smartphone className="h-3 w-3" />
                        )}
                        {tx.paymentMethod === 'cash' ? 'Cash' : 'GCash'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                      ₱{tx.finalTotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
