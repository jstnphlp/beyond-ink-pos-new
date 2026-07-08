import { usePosStore, MATERIALS, ADD_ONS } from '@/stores/pos-store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Receipt,
  Save,
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from 'lucide-react'

export function OrderSummary() {
  const {
    selectedServices,
    delivery,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    isCompletable,
    isProcessing,
    setIsProcessing,
  } = usePosStore()

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const total = getTotal()
  const deliveryFee = delivery.enabled ? delivery.fee : 0
  const completable = isCompletable()

  const handleCompleteSale = () => {
    setIsProcessing(true)
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      alert('Sale completed successfully!')
    }, 2000)
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
              Cashier: Juan Carlos
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
              const material = ss.materialId
                ? MATERIALS.find((m) => m.id === ss.materialId)
                : null
              const addOns = ss.addOns
                .map((id) => ADD_ONS.find((a) => a.id === id))
                .filter(Boolean)

              const serviceLineTotal = ss.service.basePrice * ss.quantity
              const materialLineTotal = material
                ? material.pricePerUnit * ss.quantity
                : 0

              return (
                <div key={ss.service.id} className="py-3">
                  {/* Service line */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {ss.service.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        ₱{ss.service.basePrice} × {ss.quantity}
                      </p>
                    </div>
                    <span className="ml-3 text-sm font-semibold tabular-nums">
                      ₱{serviceLineTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Material */}
                  {material && (
                    <div className="mt-1.5 flex items-center justify-between pl-3">
                      <p className="text-[11px] text-muted-foreground">
                        + {material.name} × {ss.quantity}
                      </p>
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                        ₱{materialLineTotal.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Add-ons */}
                  {addOns.map((addon) => (
                    <div
                      key={addon!.id}
                      className="mt-1 flex items-center justify-between pl-3"
                    >
                      <p className="text-[11px] text-muted-foreground">
                        + {addon!.name}
                      </p>
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                        ₱{addon!.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
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
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-1.5"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
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
