import { useState, useEffect } from 'react'
import { Calculator, Save, Trash2, FolderOpen, Pencil, X } from 'lucide-react'
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
  useReplaceQuote,
  useDeleteQuote,
  useMarginThresholds,
} from '@/shared/hooks/use-costing'
import { useAuth } from '@/shared/hooks/use-auth'
import { QuoteLineEditor, type QuoteLine } from './quote-line-editor'
import type { QuoteWithLines } from '@/shared/api/costing.types'

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
          Are you sure you want to delete "{name}"? This action cannot be undone.
        </DialogDescription>
        <div className="mt-4 flex items-center justify-end gap-2">
          <DialogClose render={<Button variant="ghost" size="sm" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => { onConfirm(); setOpen(false) }}
          >
            Delete
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}

function quoteToLines(q: QuoteWithLines): QuoteLine[] {
  return q.lineItems.map((li) => ({
    id: li.id,
    costProfileId: li.costProfileId,
    serviceName: li.serviceName,
    materialName: li.materialName,
    quantity: li.quantity,
    materialCost: li.snapMaterialCost,
    inkCost: li.snapInkCost,
    overheadCost: li.snapOverheadCost,
    spoilageRate: li.snapSpoilageRate,
    sellingPrice: li.snapSellingPrice,
    overridePrice: li.overridePrice,
  }))
}

export function QuotePlaygroundPanel() {
  const { displayName } = useAuth()
  const { data: profiles, isLoading: profilesLoading } = useCostProfiles()
  const { data: thresholds } = useMarginThresholds()
  const createMutation = useCreateQuote()
  const replaceMutation = useReplaceQuote()
  const deleteMutation = useDeleteQuote()
  const { data: quotes, isLoading: quotesLoading } = useQuotes()

  const [quoteName, setQuoteName] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [lines, setLines] = useState<QuoteLine[]>([])
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
  const [editingQuoteName, setEditingQuoteName] = useState('')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)

  const { data: viewQuote } = useQuote(viewingId)
  const { data: editQuoteData } = useQuote(loadingEditId)

  const costProfiles = profiles ?? []
  const goodThreshold = thresholds?.good ?? 40
  const allQuotes = quotes ?? []
  const isSaving = createMutation.isPending || replaceMutation.isPending

  useEffect(() => {
    if (editQuoteData && loadingEditId) {
      setEditingQuoteId(editQuoteData.id)
      setEditingQuoteName(editQuoteData.name)
      setQuoteName(editQuoteData.name)
      setQuoteNotes(editQuoteData.notes ?? '')
      setLines(quoteToLines(editQuoteData))
      setViewingId(null)
      setLoadingEditId(null)
    }
  }, [editQuoteData, loadingEditId])

  function handleSave() {
    if (!quoteName.trim() || lines.length === 0) return

    const payload = {
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
    }

    if (editingQuoteId) {
      replaceMutation.mutate(
        { id: editingQuoteId, data: payload },
        { onSuccess: clearEditor }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: clearEditor })
    }
  }

  function clearEditor() {
    setQuoteName('')
    setQuoteNotes('')
    setLines([])
    setEditingQuoteId(null)
    setEditingQuoteName('')
    setLoadingEditId(null)
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="text-brand h-4 w-4" />
              {editingQuoteId ? `Editing: ${editingQuoteName}` : 'Quote Playground'}
            </CardTitle>
            {editingQuoteId && (
              <Button variant="ghost" size="sm" onClick={clearEditor} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Cancel Edit
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {editingQuoteId
              ? 'Modify the quote below and click "Update Quote" to save changes.'
              : 'Build quotes from your cost profiles. Override prices to test "what-if" scenarios.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Quote Name</span>
              <Input
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
                placeholder="e.g. Client X — Brochures"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">Notes (optional)</span>
              <Input
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Internal notes"
              />
            </label>
          </div>

          <QuoteLineEditor
            lines={lines}
            costProfiles={costProfiles}
            goodThreshold={goodThreshold}
            onChange={setLines}
          />

          {lines.length > 0 && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!quoteName.trim() || isSaving}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Saving...' : editingQuoteId ? 'Update Quote' : 'Save Quote'}
              </Button>
            </div>
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
          {quotesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : allQuotes.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No saved quotes yet. Create your first quote above.
            </p>
          ) : (
            <div className="space-y-2">
              {allQuotes.map((q) => (
                <div key={q.id}>
                  <div
                    className={`border-border/30 flex items-center gap-3 rounded-lg border px-4 py-2.5 ${editingQuoteId === q.id ? 'border-brand/50 bg-brand/5' : ''}`}
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
                      onClick={() => setLoadingEditId(q.id)}
                      disabled={editingQuoteId === q.id || loadingEditId === q.id}
                      title="Edit in playground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setViewingId(viewingId === q.id ? null : q.id)}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                    </Button>
                    <DeleteQuoteDialog
                      name={q.name}
                      onConfirm={() => {
                        deleteMutation.mutate(q.id)
                        if (editingQuoteId === q.id) clearEditor()
                      }}
                      isPending={deleteMutation.isPending}
                    />
                  </div>

                  {viewingId === q.id && viewQuote && (
                    <Card className="border-border/50 mt-2 ml-4">
                      <CardContent className="pt-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-border/50 text-muted-foreground border-b text-left">
                                <th className="pr-3 pb-1.5 font-medium">Item</th>
                                <th className="pr-3 pb-1.5 text-right font-medium">Qty</th>
                                <th className="pr-3 pb-1.5 text-right font-medium">Unit Price</th>
                                <th className="pr-3 pb-1.5 text-right font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-border/30 divide-y">
                              {viewQuote.lineItems.map((li) => {
                                const price = li.overridePrice ?? li.snapSellingPrice
                                return (
                                  <tr key={li.id}>
                                    <td className="py-1.5 pr-3">
                                      <span className="font-medium">{li.serviceName}</span>
                                      <span className="text-muted-foreground"> — {li.materialName}</span>
                                    </td>
                                    <td className="py-1.5 pr-3 text-right tabular-nums">{li.quantity}</td>
                                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatCurrency(price)}</td>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
