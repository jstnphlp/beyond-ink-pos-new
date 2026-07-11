import { useState } from 'react'
import { Calculator, Save, Trash2, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import {
  useCostProfiles,
  useQuotes,
  useQuote,
  useCreateQuote,
  useDeleteQuote,
  useMarginThresholds,
} from '@/shared/hooks/use-costing'
import { useAuth } from '@/shared/hooks/use-auth'
import { QuoteLineEditor, type QuoteLine } from './quote-line-editor'

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function DeleteQuoteDialog({
  name,
  onConfirm,
  isPending,
}: {
  name: string
  onConfirm: () => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="icon-sm" />}>
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogPopup>
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{name}"? This action cannot be
          undone.
        </DialogDescription>
        <div className="mt-4 flex items-center justify-end gap-2">
          <DialogClose render={<Button variant="ghost" size="sm" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Delete
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}

function SavedQuotesList() {
  const { data: quotes, isLoading } = useQuotes()
  const deleteMutation = useDeleteQuote()
  const [viewingId, setViewingId] = useState<string | null>(null)
  const { data: viewQuote } = useQuote(viewingId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  const allQuotes = quotes ?? []

  if (allQuotes.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No saved quotes yet. Create your first quote above.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {allQuotes.map((q) => (
        <div
          key={q.id}
          className="border-border/30 flex items-center gap-3 rounded-lg border px-4 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{q.name}</p>
            <p className="text-muted-foreground text-xs">
              {q.lineItemCount} item{q.lineItemCount !== 1 ? 's' : ''} ·{' '}
              {q.createdBy} · {new Date(q.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewingId(viewingId === q.id ? null : q.id)}
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </Button>
          <DeleteQuoteDialog
            name={q.name}
            onConfirm={() => deleteMutation.mutate(q.id)}
            isPending={deleteMutation.isPending}
          />
        </div>
      ))}

      {viewingId && viewQuote && (
        <Card className="border-border/50 mt-3">
          <CardHeader>
            <CardTitle className="text-sm">{viewQuote.name}</CardTitle>
            {viewQuote.notes && (
              <p className="text-muted-foreground text-xs">{viewQuote.notes}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-border/50 text-muted-foreground border-b text-left">
                    <th className="pr-3 pb-1.5 font-medium">Item</th>
                    <th className="pr-3 pb-1.5 text-right font-medium">Qty</th>
                    <th className="pr-3 pb-1.5 text-right font-medium">
                      Unit Price
                    </th>
                    <th className="pr-3 pb-1.5 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border/30 divide-y">
                  {viewQuote.lineItems.map((li) => {
                    const price = li.overridePrice ?? li.snapSellingPrice
                    return (
                      <tr key={li.id}>
                        <td className="py-1.5 pr-3">
                          <span className="font-medium">{li.serviceName}</span>
                          <span className="text-muted-foreground">
                            {' '}
                            — {li.materialName}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {li.quantity}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {formatCurrency(price)}
                        </td>
                        <td className="py-1.5 text-right font-medium tabular-nums">
                          {formatCurrency(price * li.quantity)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function QuotePlaygroundPanel() {
  const { displayName } = useAuth()
  const { data: profiles, isLoading: profilesLoading } = useCostProfiles()
  const { data: thresholds } = useMarginThresholds()
  const createMutation = useCreateQuote()

  const [quoteName, setQuoteName] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [lines, setLines] = useState<QuoteLine[]>([])

  const costProfiles = profiles ?? []
  const goodThreshold = thresholds?.good ?? 40

  function handleSave() {
    if (!quoteName.trim() || lines.length === 0) return

    createMutation.mutate(
      {
        name: quoteName.trim(),
        notes: quoteNotes.trim() || undefined,
        createdBy: displayName ?? 'Unknown',
        lineItems: lines.map((l) => ({
          costProfileId: l.costProfileId,
          quantity: l.quantity,
          snapMaterialCost: l.materialCost,
          snapInkCost: l.inkCost,
          snapOverheadCost: l.overheadCost,
          snapSpoilageRate: l.spoilageRate,
          snapSellingPrice: l.sellingPrice,
          overridePrice: l.overridePrice ?? undefined,
        })),
      },
      {
        onSuccess: () => {
          setQuoteName('')
          setQuoteNotes('')
          setLines([])
        },
      }
    )
  }

  if (profilesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="text-brand h-4 w-4" />
            Quote Playground
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Build quotes from your cost profiles. Override prices to test
            "what-if" scenarios.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuoteLineEditor
            lines={lines}
            costProfiles={costProfiles}
            goodThreshold={goodThreshold}
            onChange={setLines}
          />

          {lines.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs font-medium">
                    Quote Name
                  </span>
                  <Input
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="e.g. Client X — Brochures"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs font-medium">
                    Notes (optional)
                  </span>
                  <Input
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Internal notes"
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!quoteName.trim() || createMutation.isPending}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {createMutation.isPending ? 'Saving...' : 'Save Quote'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="text-brand h-4 w-4" />
            Saved Quotes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SavedQuotesList />
        </CardContent>
      </Card>
    </div>
  )
}
