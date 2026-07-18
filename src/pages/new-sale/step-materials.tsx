import { usePosStore, resolveMaterialsForService } from '@/stores/pos-store'
import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Minus, Plus, Package } from 'lucide-react'

export function StepMaterials() {
  const {
    selectedServices,
    updateServiceMaterial,
    updateServiceMaterialPrice,
    updateServiceQuantity,
    catalog,
  } = usePosStore()
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({})
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})

  const handlePriceChange = useCallback((serviceId: string, raw: string) => {
    setPriceDrafts((prev) => ({ ...prev, [serviceId]: raw }))
    if (raw === '') {
      updateServiceMaterialPrice(serviceId, null)
    } else {
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        updateServiceMaterialPrice(serviceId, parsed)
      }
    }
  }, [updateServiceMaterialPrice])

  const handlePriceBlur = useCallback((serviceId: string, raw: string) => {
    const parsed = parseFloat(raw)
    if (isNaN(parsed) || parsed < 0) {
      updateServiceMaterialPrice(serviceId, null)
    } else {
      updateServiceMaterialPrice(serviceId, parsed)
    }
    setPriceDrafts((prev) => {
      const next = { ...prev }
      delete next[serviceId]
      return next
    })
  }, [updateServiceMaterialPrice])

  const handleQuantityChange = useCallback((serviceId: string, raw: string) => {
    setQtyDrafts((prev) => ({ ...prev, [serviceId]: raw }))
    if (raw !== '' && raw !== '0') {
      const parsed = parseInt(raw, 10)
      if (!isNaN(parsed) && parsed > 0) {
        updateServiceQuantity(serviceId, parsed)
      }
    }
  }, [updateServiceQuantity])

  const handleQuantityBlur = useCallback((serviceId: string, raw: string) => {
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed) || parsed < 1) {
      updateServiceQuantity(serviceId, 1)
    } else {
      updateServiceQuantity(serviceId, parsed)
    }
    setQtyDrafts((prev) => {
      const next = { ...prev }
      delete next[serviceId]
      return next
    })
  }, [updateServiceQuantity])

  if (selectedServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          No services selected
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Go back and select at least one service.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Materials & Quantity
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure materials and quantity for each service.
        </p>
      </div>

      <div className="space-y-4">
        {selectedServices.map((ss) => {
          const isDesignDev = ss.service.department === 'Design' || ss.service.department === 'Dev'

          return (
            <div
              key={ss.service.id}
              className="rounded-xl border border-border/60 bg-card p-5"
            >
              {/* Service name + price */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{ss.service.name}</h3>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  ₱{ss.service.basePrice.toLocaleString()}
                </span>
              </div>

              {isDesignDev ? (
                /* Design/Dev: Editable Price + Quantity */
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Price
                    </label>
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground shrink-0">₱</span>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={priceDrafts[ss.service.id] ?? String(ss.customMaterialPrice ?? ss.service.basePrice)}
                        onChange={(e) => handlePriceChange(ss.service.id, e.target.value)}
                        onBlur={(e) => handlePriceBlur(ss.service.id, e.target.value)}
                        className="h-7 flex-1 border-0 bg-transparent px-0 text-sm font-medium tabular-nums focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1 mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        Base: ₱{ss.service.basePrice.toLocaleString()}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        ₱{((ss.customMaterialPrice ?? ss.service.basePrice) * ss.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="w-36">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Quantity
                    </label>
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => updateServiceQuantity(ss.service.id, ss.quantity - 1)}
                        className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-default hover:bg-muted hover:text-foreground rounded-l-lg"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <Input
                        type="number"
                        min={1}
                        value={qtyDrafts[ss.service.id] ?? ss.quantity}
                        onChange={(e) => handleQuantityChange(ss.service.id, e.target.value)}
                        onBlur={(e) => handleQuantityBlur(ss.service.id, e.target.value)}
                        className="h-10 flex-1 border-0 border-x border-border text-center text-sm font-semibold rounded-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateServiceQuantity(ss.service.id, ss.quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-default hover:bg-muted hover:text-foreground rounded-r-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Physical: Material checkboxes + Quantity, price from service */
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                  {/* Material selection */}
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Materials
                    </label>
                    <div className="border-border/50 divide-border/20 max-h-40 divide-y overflow-y-auto rounded-lg border">
                      {resolveMaterialsForService(ss.service.id, catalog).map((mat) => (
                        <label
                          key={mat.id}
                          className="hover:bg-muted/30 flex cursor-pointer items-center gap-2.5 px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={ss.materialIds.includes(mat.id)}
                            onChange={() => updateServiceMaterial(ss.service.id, mat.id)}
                            className="accent-brand h-3.5 w-3.5"
                          />
                          <span className="text-sm">{mat.name}</span>
                          {mat.stockLevel === 'low' && (
                            <AlertTriangle className="ml-auto h-3 w-3 text-warning" />
                          )}
                        </label>
                      ))}
                    </div>
                    {ss.materialIds.length > 0 && (
                      <span className="text-muted-foreground text-[11px]">
                        {ss.materialIds.length} material{ss.materialIds.length !== 1 ? 's' : ''} selected
                      </span>
                    )}

                    {/* Editable price */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-xs text-muted-foreground shrink-0">₱</span>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={priceDrafts[ss.service.id] ?? String(ss.customMaterialPrice ?? ss.service.basePrice)}
                          onChange={(e) => handlePriceChange(ss.service.id, e.target.value)}
                          onBlur={(e) => handlePriceBlur(ss.service.id, e.target.value)}
                          className="h-7 flex-1 border-0 bg-transparent px-0 text-sm font-medium tabular-nums focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] text-muted-foreground">
                          Base: ₱{ss.service.basePrice.toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          ₱{((ss.customMaterialPrice ?? ss.service.basePrice) * ss.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="w-36">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Quantity
                    </label>
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() =>
                          updateServiceQuantity(ss.service.id, ss.quantity - 1)
                        }
                        className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-default hover:bg-muted hover:text-foreground rounded-l-lg"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <Input
                        type="number"
                        min={1}
                        value={qtyDrafts[ss.service.id] ?? ss.quantity}
                        onChange={(e) => handleQuantityChange(ss.service.id, e.target.value)}
                        onBlur={(e) => handleQuantityBlur(ss.service.id, e.target.value)}
                        className="h-10 flex-1 border-0 border-x border-border text-center text-sm font-semibold rounded-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateServiceQuantity(ss.service.id, ss.quantity + 1)
                        }
                        className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-default hover:bg-muted hover:text-foreground rounded-r-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
