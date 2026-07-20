import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import {
  useUpsertCostProfile,
  useMarginThresholds,
} from '@/shared/hooks/use-costing'
import type { CostProfile, CostProfileInput } from '@/shared/api/costing.types'
import type {
  CatalogService,
  CatalogMaterial,
} from '@/shared/api/catalog.types'

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusBadge({
  marginPct,
  thresholds,
}: {
  marginPct: number
  thresholds: { great: number; good: number }
}) {
  if (marginPct >= thresholds.great) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        Great
      </span>
    )
  }
  if (marginPct >= thresholds.good) {
    return (
      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
        Good
      </span>
    )
  }
  if (marginPct >= 20) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
        OK
      </span>
    )
  }
  return (
    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
      Low
    </span>
  )
}

export function CostProfileFormDialog({
  profile,
  services,
  materials,
  trigger,
}: {
  profile?: CostProfile
  services: CatalogService[]
  materials: CatalogMaterial[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [serviceId, setServiceId] = useState(profile?.serviceId ?? '')
  const [inventoryItemId, setInventoryItemId] = useState(
    profile?.inventoryItemId ?? ''
  )
  const [materialCost, setMaterialCost] = useState(
    profile?.materialCost?.toString() ?? ''
  )
  const [inkCost, setInkCost] = useState(profile?.inkCost?.toString() ?? '')

  const upsertMutation = useUpsertCostProfile()
  const { data: thresholds } = useMarginThresholds()
  const marginThresholds = thresholds ?? { great: 50, good: 35 }
  const isEdit = !!profile

  const selectedService = services.find((s) => s.id === serviceId)
  const sellingPrice = selectedService?.basePrice ?? 0

  const derived = useMemo(() => {
    const mc = parseFloat(materialCost) || 0
    const ic = parseFloat(inkCost) || 0
    const overhead = mc * 0.25
    const totalCost = mc + ic + overhead
    const profit = sellingPrice - totalCost
    const marginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0
    return { overhead, totalCost, profit, marginPct }
  }, [materialCost, inkCost, sellingPrice])

  useEffect(() => {
    if (open && profile) {
      setServiceId(profile.serviceId)
      setInventoryItemId(profile.inventoryItemId)
      setMaterialCost(profile.materialCost.toString())
      setInkCost(profile.inkCost.toString())
    } else if (open && !profile) {
      setServiceId('')
      setInventoryItemId('')
      setMaterialCost('')
      setInkCost('')
    }
  }, [open, profile])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!serviceId || !inventoryItemId) return

    const input: CostProfileInput = {
      serviceId,
      inventoryItemId,
      materialCost: parseFloat(materialCost) || 0,
      inkCost: parseFloat(inkCost) || 0,
      spoilageRate: 0,
    }

    upsertMutation.mutate(input, { onSuccess: () => setOpen(false) })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogPopup>
        <DialogTitle>
          {isEdit ? 'Edit Cost Profile' : 'Add Pricing Row'}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the cost breakdown.'
            : 'Pick a service + material to add to the pricing table.'}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Service
            </span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-popover px-2.5 text-sm outline-none focus-visible:ring-3"
              required
              disabled={isEdit}
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              Material / Paper Size
            </span>
            <select
              value={inventoryItemId}
              onChange={(e) => setInventoryItemId(e.target.value)}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-popover px-2.5 text-sm outline-none focus-visible:ring-3"
              required
              disabled={isEdit}
            >
              <option value="">Select a material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                Material Cost (₱)
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                Ink Cost (₱)
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={inkCost}
                onChange={(e) => setInkCost(e.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>

          <div className="border-border/50 bg-muted/30 space-y-2 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Preview
            </p>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <span className="text-muted-foreground">Overhead (25%)</span>
              <span className="text-right tabular-nums">
                {formatCurrency(derived.overhead)}
              </span>
              <span className="border-border/50 border-t pt-1 font-medium">
                Total Cost
              </span>
              <span className="border-border/50 border-t pt-1 text-right font-medium tabular-nums">
                {formatCurrency(derived.totalCost)}
              </span>
              <span className="text-muted-foreground">Price</span>
              <span className="text-right tabular-nums">
                {formatCurrency(sellingPrice)}
              </span>
              <span className="font-medium">Profit</span>
              <span
                className={`text-right font-medium tabular-nums ${derived.profit >= 0 ? 'text-emerald-400' : 'text-destructive'}`}
              >
                {formatCurrency(derived.profit)}
              </span>
              <span className="text-muted-foreground">Margin</span>
              <span className="flex items-center justify-end gap-2 text-right">
                <span className="tabular-nums">
                  {derived.marginPct.toFixed(1)}%
                </span>
                <StatusBadge
                  marginPct={derived.marginPct}
                  thresholds={marginThresholds}
                />
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
              disabled={
                upsertMutation.isPending || !serviceId || !inventoryItemId
              }
            >
              {upsertMutation.isPending
                ? 'Saving...'
                : isEdit
                  ? 'Update'
                  : 'Add Row'}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
