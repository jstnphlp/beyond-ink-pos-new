import { useWalletSummary } from '@/shared/hooks/use-wallet'
import { Card, CardContent } from '@/components/ui/card'
import { Banknote, Smartphone } from 'lucide-react'


export function WalletCards() {
  const { data: summary, isLoading } = useWalletSummary()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cashTotal = summary?.cashTotal ?? 0
  const gcashTotal = summary?.gcashTotal ?? 0

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 shadow-lg shadow-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <Banknote className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400/80">Cash Wallet</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                ₱{cashTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5 shadow-lg shadow-blue-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
              <Smartphone className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-400/80">GCash Wallet</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                ₱{gcashTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
      </CardContent>
      </Card>
    </div>
  )
}
