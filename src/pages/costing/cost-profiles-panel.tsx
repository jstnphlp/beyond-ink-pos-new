import { useState, useEffect } from 'react'
import { Plus, Trash2, Upload, Search, DollarSign, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
  useUpsertCostProfile,
  useDeleteCostProfile,
  useMarginThresholds,
} from '@/shared/hooks/use-costing'
import { useCatalog } from '@/shared/hooks/use-catalog'
import { CostProfileFormDialog } from './cost-profile-form'
import { CsvImportDialog } from './csv-import'
import type { CostProfile } from '@/shared/api/costing.types'

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pct(value: number, total: number): string {
  if (total <= 0) return '—'
  return `${((value / total) * 100).toFixed(2)}%`
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
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 whitespace-nowrap text-emerald-400"
      >
        ✔ Great
      </Badge>
    )
  }
  if (marginPct >= thresholds.good) {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 bg-blue-500/10 whitespace-nowrap text-blue-400"
      >
        ✔ Good
      </Badge>
    )
  }
  if (marginPct >= 20) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/10 whitespace-nowrap text-amber-400"
      >
        △ OK
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-red-500/30 bg-red-500/10 whitespace-nowrap text-red-400"
    >
      ✘ Low
    </Badge>
  )
}

function InlineEditCell({
  value,
  onSave,
}: {
  value: number
  onSave: (val: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value.toString())

  useEffect(() => {
    if (!editing) setDraft(value.toString())
  }, [value, editing])

  function commit() {
    const parsed = parseFloat(draft) || 0
    if (parsed !== value) onSave(parsed)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        className="hover:text-foreground group flex w-full cursor-pointer items-center justify-end gap-1 text-right tabular-nums"
        onClick={() => setEditing(true)}
      >
        <span>{formatCurrency(value)}</span>
        <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min="0"
        step="0.01"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(value.toString())
            setEditing(false)
          }
        }}
        className="h-7 w-24 text-right text-xs tabular-nums"
        autoFocus
      />
    </div>
  )
}

function DeleteDialog({
  label,
  onConfirm,
  isPending,
}: {
  label: string
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
        <DialogTitle>Delete Cost Profile</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the cost profile for "{label}"?
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

function CostRow({
  profile,
  thresholds,
}: {
  profile: CostProfile
  thresholds: { great: number; good: number }
}) {
  const upsertMutation = useUpsertCostProfile()
  const deleteMutation = useDeleteCostProfile()

  const price = profile.sellingPrice
  const overhead = profile.materialCost * 0.25
  const totalCost = profile.materialCost + profile.inkCost + overhead
  const costPctNum = price > 0 ? (totalCost / price) * 100 : 0
  const profit = price - totalCost
  const marginPct = price > 0 ? (profit / price) * 100 : 0

  function handleFieldChange(field: 'materialCost' | 'inkCost', val: number) {
    upsertMutation.mutate({
      serviceId: profile.serviceId,
      inventoryItemId: profile.inventoryItemId,
      materialCost: field === 'materialCost' ? val : profile.materialCost,
      inkCost: field === 'inkCost' ? val : profile.inkCost,
      spoilageRate: profile.spoilageRate,
    })
  }

  return (
    <tr className="border-border/30 hover:bg-muted/20 border-b last:border-b-0">
      <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
        <span>{profile.serviceName}</span>
        <span className="text-muted-foreground"> — {profile.materialName}</span>
      </td>
      <td className="px-3 py-2 text-right">
        <InlineEditCell
          value={profile.materialCost}
          onSave={(v) => handleFieldChange('materialCost', v)}
        />
      </td>
      <td className="text-muted-foreground px-3 py-2 text-right text-xs tabular-nums">
        {pct(profile.materialCost, price)}
      </td>
      <td className="px-3 py-2 text-right">
        <InlineEditCell
          value={profile.inkCost}
          onSave={(v) => handleFieldChange('inkCost', v)}
        />
      </td>
      <td className="text-muted-foreground px-3 py-2 text-right text-xs tabular-nums">
        {pct(profile.inkCost, price)}
      </td>
      <td className="px-3 py-2 text-right text-sm tabular-nums">
        {formatCurrency(overhead)}
      </td>
      <td className="text-muted-foreground px-3 py-2 text-right text-xs tabular-nums">
        {pct(overhead, price)}
      </td>
      <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
        {formatCurrency(totalCost)}
      </td>
      <td className="text-muted-foreground px-3 py-2 text-right text-xs tabular-nums">
        {costPctNum > 0 ? `${costPctNum.toFixed(2)}%` : '—'}
      </td>
      <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
        {formatCurrency(price)}
      </td>
      <td
        className={`px-3 py-2 text-right text-sm font-medium tabular-nums ${profit >= 0 ? 'text-emerald-400' : 'text-destructive'}`}
      >
        {formatCurrency(profit)}
      </td>
      <td
        className={`px-3 py-2 text-right text-sm font-medium tabular-nums ${marginPct >= 0 ? 'text-emerald-400' : 'text-destructive'}`}
      >
        {marginPct.toFixed(1)}%
      </td>
      <td className="px-3 py-2">
        <StatusBadge marginPct={marginPct} thresholds={thresholds} />
      </td>
      <td className="px-1 py-2">
        <DeleteDialog
          label={`${profile.serviceName} — ${profile.materialName}`}
          onConfirm={() => deleteMutation.mutate(profile.id)}
          isPending={deleteMutation.isPending}
        />
      </td>
    </tr>
  )
}

export function CostProfilesPanel() {
  const { data: profiles, isLoading: profilesLoading } = useCostProfiles()
  const { data: catalog, isLoading: catalogLoading } = useCatalog()
  const { data: thresholds } = useMarginThresholds()
  const [search, setSearch] = useState('')

  const marginThresholds = thresholds ?? { great: 50, good: 35 }
  const services = catalog?.services ?? []
  const materials = catalog?.materials ?? []
  const allProfiles = profiles ?? []

  const filtered = allProfiles.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.serviceName.toLowerCase().includes(q) ||
      p.materialName.toLowerCase().includes(q)
    )
  })

  const isLoading = profilesLoading || catalogLoading

  if (isLoading) {
    return (
      <Card className="border-border/50 overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="text-brand h-4 w-4" />
            Pricing Calculator
          </CardTitle>
          <div className="flex items-center gap-2">
            <CsvImportDialog
              services={services}
              materials={materials}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Import CSV
                </Button>
              }
            />
            <CostProfileFormDialog
              services={services}
              materials={materials}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Row
                </Button>
              }
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service or material..."
              className="h-8 pl-8"
            />
          </div>
          <span className="text-muted-foreground text-xs">
            {filtered.length} row{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            {allProfiles.length === 0
              ? 'No pricing rows yet. Click "Add Row" to pick a service + material, or import from CSV.'
              : 'No rows match your search.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border text-muted-foreground border-b-2 text-left text-xs">
                  <th className="px-3 pb-2 font-medium whitespace-nowrap">
                    Service / Paper Size
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Material Cost (₱)
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Mat Cost %
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Ink Cost (₱)
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Ink Cost %
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Overhead (₱)
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Overhead %
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Total Cost (₱)
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Cost %
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Price (₱)
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Profit (₱)
                  </th>
                  <th className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Profit Margin %
                  </th>
                  <th className="px-3 pb-2 font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-1 pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((profile) => (
                  <CostRow
                    key={profile.id}
                    profile={profile}
                    thresholds={marginThresholds}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-muted-foreground border-border/30 mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-xs">
          <span className="font-medium">Legend:</span>
          <span>✔ Great = {marginThresholds.great}%+</span>
          <span>
            ✔ Good = {marginThresholds.good}–{marginThresholds.great}%
          </span>
          <span>△ OK = 20–{marginThresholds.good}%</span>
          <span>✘ Low = below 20%</span>
          <span className="ml-auto">
            Click Material Cost or Ink Cost cells to edit inline
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
