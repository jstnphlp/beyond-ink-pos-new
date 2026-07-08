import { Clock, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  refunded: 'bg-red-500/15 text-red-400 border-red-500/25',
}

const MOCK_HISTORY = [
  { id: 'TXN-2026-0047', customer: 'Maria Santos', amount: 350, status: 'completed', date: 'Jul 8, 2026 · 8:32 AM', method: 'Cash' },
  { id: 'TXN-2026-0046', customer: 'Carlo Reyes', amount: 1500, status: 'completed', date: 'Jul 8, 2026 · 8:15 AM', method: 'GCash' },
  { id: 'TXN-2026-0045', customer: 'Lisa Gomez', amount: 85, status: 'pending', date: 'Jul 8, 2026 · 7:58 AM', method: 'Cash' },
  { id: 'TXN-2026-0044', customer: 'Mark Tan', amount: 5000, status: 'completed', date: 'Jul 8, 2026 · 7:30 AM', method: 'GCash' },
  { id: 'TXN-2026-0043', customer: 'Rosa Lim', amount: 220, status: 'refunded', date: 'Jul 8, 2026 · 7:12 AM', method: 'Cash' },
  { id: 'TXN-2026-0042', customer: 'Jake Cruz', amount: 800, status: 'completed', date: 'Jul 7, 2026 · 5:45 PM', method: 'Cash' },
  { id: 'TXN-2026-0041', customer: 'Anna Bautista', amount: 2400, status: 'completed', date: 'Jul 7, 2026 · 4:20 PM', method: 'GCash' },
]

export function HistoryPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse all past transactions and receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search transactions…" className="pl-9" />
          </div>
          <Button variant="outline" size="default" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-brand" />
            All Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/40">
            {MOCK_HISTORY.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{txn.id}</p>
                    <Badge
                      variant="outline"
                      className={`border text-[10px] font-semibold uppercase ${STATUS_STYLES[txn.status]}`}
                    >
                      {txn.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {txn.customer} · {txn.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">₱{txn.amount.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">{txn.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
