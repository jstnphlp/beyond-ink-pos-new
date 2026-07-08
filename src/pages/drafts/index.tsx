import { FileText, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const MOCK_DRAFTS = [
  { id: 'DRF-0012', services: 'Document Printing, Laminating', total: 120, date: 'Jul 8, 2026 · 8:20 AM', cashier: 'Juan C.' },
  { id: 'DRF-0011', services: 'Logo Design', total: 500, date: 'Jul 8, 2026 · 7:45 AM', cashier: 'Ana M.' },
  { id: 'DRF-0010', services: 'Tarpaulin Printing, Grommets', total: 680, date: 'Jul 7, 2026 · 4:30 PM', cashier: 'Juan C.' },
  { id: 'DRF-0009', services: 'Photo Prints, Rush Processing', total: 340, date: 'Jul 7, 2026 · 2:15 PM', cashier: 'Kim S.' },
]

export function DraftsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Drafts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resume or discard previously saved transactions.
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search drafts…" className="pl-9" />
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-brand" />
            All Drafts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y divide-border/40">
            {MOCK_DRAFTS.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{draft.id}</p>
                    <Badge variant="outline" className="text-[10px]">Draft</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {draft.services} · {draft.cashier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">₱{draft.total.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">{draft.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
