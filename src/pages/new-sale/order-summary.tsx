import { useState, useEffect, useRef } from 'react'
import { usePosStore, resolveMaterials } from '@/stores/pos-store'
import { completeSale } from '@/shared/api/sales'
import { saveDraft, updateDraft } from '@/shared/api/drafts'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/hooks/use-auth'
import {
  Receipt,
  Save,
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from 'lucide-react'

export function OrderSummary() {
  const queryClient = useQueryClient()
  const { displayName } = useAuth()
  const cashierName = displayName ?? 'Staff'
  const {
    selectedServices,
    delivery,
    discount,
    currentStep,
    paymentMethod,
    cashReceived,
    contributors,
    catalog,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    isCompletable,
    isProcessing,
    setIsProcessing,
    resetSale,
    currentDraftId,
    setCurrentDraftId,
    draftName: storeDraftName,
    userDepartment,
    isSavingDraft,
    setIsSavingDraft,
  } = usePosStore()

  const materials = resolveMaterials(catalog)

  const [draftName, setDraftName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const autoSavedRef = useRef<string | null>(null)

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const total = getTotal()
  const deliveryFee = delivery.enabled ? delivery.fee : 0
  const completable = isCompletable()

  useEffect(() => {
    if (
      currentDraftId &&
      selectedServices.length > 0 &&
      autoSavedRef.current !== currentDraftId &&
      !isSavingDraft
    ) {
      autoSavedRef.current = currentDraftId
      const state = usePosStore.getState()
      const params = {
        name: state.draftName || undefined,
        selectedServices: state.selectedServices,
        delivery: state.delivery,
        discount: state.discount,
        currentStep: state.currentStep,
        subtotal: state.getSubtotal(),
        total: state.getTotal(),
        cashierName,
      }
      setIsSavingDraft(true)
      updateDraft(currentDraftId, params)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['drafts'] })
        })
        .catch((err) => {
          console.error('Auto-save draft failed:', err)
        })
        .finally(() => {
          setIsSavingDraft(false)
        })
    }
  }, [currentDraftId, selectedServices.length])

  const handleCompleteSale = async () => {
    setIsProcessing(true)
    try {
      await completeSale({
        selectedServices,
        delivery,
        discount,
        paymentMethod,
        cashReceived,
        subtotal,
        discountAmount,
        total,
        cashierName,
        contributors,
        catalog,
        department: userDepartment ?? 'physical_dept',
      })
      toast.success('Sale completed', {
        description: `Transaction saved — Total: ₱${total.toLocaleString()}`,
      })
      resetSale()
    } catch (err) {
      console.error('Sale failed:', JSON.stringify(err, null, 2), err)
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? (err as any)?.details ?? 'Something went wrong'
      toast.error('Failed to save sale', { description: msg })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setDialogOpen(false)
    try {
      const params = {
        name: draftName.trim() || undefined,
        selectedServices,
        delivery,
        discount,
        currentStep,
        subtotal,
        total,
        cashierName,
      }

      if (currentDraftId) {
        await updateDraft(currentDraftId, params)
        toast.success('Draft updated', {
          description: `Draft saved — ₱${total.toLocaleString()}`,
        })
      } else {
        const id = await saveDraft(params)
        setCurrentDraftId(id)
        toast.success('Draft saved', {
          description: `Draft created — ₱${total.toLocaleString()}`,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
      resetSale()
      setDraftName('')
    } catch (err) {
      console.error('Save draft failed:', err)
      toast.error('Failed to save draft', {
        description: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleDraftButtonClick = () => {
    if (selectedServices.length === 0) {
      toast.error('Add at least one service before saving a draft.')
      return
    }
    if (currentDraftId) {
      handleSaveDraftDirect()
    } else {
      setDraftName('')
      setDialogOpen(true)
    }
  }

  const handleSaveDraftDirect = async () => {
    setIsSavingDraft(true)
    try {
      const params = {
        name: storeDraftName || undefined,
        selectedServices,
        delivery,
        discount,
        currentStep,
        subtotal,
        total,
        cashierName,
      }

      await updateDraft(currentDraftId!, params)
      toast.success('Draft updated', {
        description: `Draft saved — ₱${total.toLocaleString()}`,
      })
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
      resetSale()
    } catch (err) {
      console.error('Save draft failed:', err)
      toast.error('Failed to save draft', {
        description: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-card/50">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Receipt className="h-4.5 w-4.5 text-brand" />
          <div>
            <h3 className="text-sm font-bold">Transaction Draft</h3>
            <p className="text-[11px] text-muted-foreground">
              Cashier: {cashierName}
            </p>
          </div>
        </div>
      </div>

      {/* Body — scrollable line items */}
      <ScrollArea className="flex-1 px-5">
        {selectedServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground/60">
              No items yet
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/40">
              Select services to begin
            </p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border/40 py-3">
            {selectedServices.map((ss) => {
              const isDesignDev = ss.service.department === 'Design' || ss.service.department === 'Dev'
              const material = !isDesignDev && ss.materialId
                ? materials.find((m) => m.id === ss.materialId)
                : null

              const unitPrice = isDesignDev
                ? (ss.customMaterialPrice ?? ss.service.basePrice)
                : material
                  ? (ss.customMaterialPrice ?? material.pricePerUnit)
                  : null
              const lineTotal = unitPrice !== null ? unitPrice * ss.quantity : null

              return (
                <div key={ss.service.id} className="py-3">
                  {/* Service line */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {ss.service.name}
                      </p>
                      {unitPrice !== null && (
                        <p className="text-[11px] text-muted-foreground">
                          ₱{unitPrice.toLocaleString()}{material ? `/${material.unit}` : ''} × {ss.quantity}
                        </p>
                      )}
                    </div>
                    {lineTotal !== null && (
                      <span className="ml-3 text-sm font-semibold tabular-nums">
                        ₱{lineTotal.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Material */}
                  {material && (
                    <div className="mt-1.5 flex items-center justify-between pl-3">
                      <p className="text-[11px] text-muted-foreground">
                        {material.name}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer — Totals & Actions */}
      <div className="shrink-0 border-t border-border">
        {/* Totals */}
        <div className="space-y-2 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Subtotal</span>
            <span className="text-sm font-medium tabular-nums">
              ₱{subtotal.toLocaleString()}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-destructive">Discount</span>
              <span className="text-sm font-medium tabular-nums text-destructive">
                −₱{discountAmount.toLocaleString()}
              </span>
            </div>
          )}

          {deliveryFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Delivery Fee
              </span>
              <span className="text-sm font-medium tabular-nums">
                ₱{deliveryFee.toLocaleString()}
              </span>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Total</span>
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              ₱{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 border-t border-border px-5 py-4">
          {currentDraftId ? (
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={isSavingDraft || selectedServices.length === 0}
              onClick={() => handleDraftButtonClick()}
            >
              {isSavingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Update Draft
            </button>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                disabled={isSavingDraft || selectedServices.length === 0}
                onClick={(e) => {
                  e.preventDefault()
                  handleDraftButtonClick()
                }}
              >
                {isSavingDraft ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </DialogTrigger>
              <DialogPopup>
                <DialogTitle>Save Draft</DialogTitle>
                <DialogDescription className="mt-1.5">
                  Optionally name this draft for easy identification.
                </DialogDescription>
                <div className="mt-4">
                  <Input
                    placeholder="e.g. Maria's print order"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDraft()
                    }}
                    autoFocus
                  />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <DialogClose
                    className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setDraftName('')}
                  >
                    Cancel
                  </DialogClose>
                  <Button
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    className="gap-1.5"
                  >
                    {isSavingDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </DialogPopup>
            </Dialog>
          )}

          <Button
            size="lg"
            disabled={!completable || isProcessing}
            onClick={handleCompleteSale}
            className="flex-[2] gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-40 glow-brand"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Complete Sale
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
