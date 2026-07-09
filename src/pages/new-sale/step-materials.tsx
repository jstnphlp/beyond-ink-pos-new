import { usePosStore, resolveMaterials, resolveMaterialsForService } from '@/stores/pos-store'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Minus, Plus, Package } from 'lucide-react'

export function StepMaterials() {
  const {
    selectedServices,
    updateServiceMaterial,
    updateServiceQuantity,
    catalog,
  } = usePosStore()
  const materials = resolveMaterials(catalog)

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
        {selectedServices.map((ss) => (
          <div
            key={ss.service.id}
            className="rounded-xl border border-border/60 bg-card p-5"
          >
            {/* Service name */}
            <h3 className="text-sm font-semibold">{ss.service.name}</h3>

            {/* Material select + Quantity */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
              {/* Material select */}
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Material
                </label>
                <select
                  value={ss.materialId ?? ''}
                  onChange={(e) =>
                    updateServiceMaterial(ss.service.id, e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-default focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
                >
                  <option value="">No material</option>
                  {resolveMaterialsForService(ss.service.id, catalog).map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} — ₱{mat.pricePerUnit}/{mat.unit}
                    </option>
                  ))}
                </select>

                {/* Low stock warning */}
                {ss.materialId && (() => {
                  const mat = materials.find((m) => m.id === ss.materialId)
                  if (mat?.stockLevel === 'low') {
                    return (
                      <div className="mt-1.5 flex items-center gap-1.5 text-warning">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-[11px] font-medium">
                          Low stock — order soon
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Price display */}
                {ss.materialId && (() => {
                  const mat = materials.find((m) => m.id === ss.materialId)
                  if (!mat) return null
                  const unitPrice = mat.pricePerUnit
                  const lineTotal = unitPrice * ss.quantity
                  return (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        ₱{unitPrice.toLocaleString()}/{mat.unit}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        ₱{lineTotal.toLocaleString()}
                      </span>
                    </div>
                  )
                })()}
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
                      updateServiceQuantity(
                        ss.service.id,
                        ss.quantity - 1
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-default hover:bg-muted hover:text-foreground rounded-l-lg"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    type="number"
                    min={1}
                    value={ss.quantity}
                    onChange={(e) =>
                      updateServiceQuantity(
                        ss.service.id,
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="h-10 flex-1 border-0 border-x border-border text-center text-sm font-semibold rounded-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateServiceQuantity(
                        ss.service.id,
                        ss.quantity + 1
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-default hover:bg-muted hover:text-foreground rounded-r-lg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
