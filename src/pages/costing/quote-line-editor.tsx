import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { CostProfile } from '@/shared/api/costing.types'

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export interface QuoteLine {
  id: string
  costProfileId: string
  serviceName: string
  materialName: string
  quantity: number
  materialCost: number
  inkCost: number
  overheadCost: number
  spoilageRate: number
  sellingPrice: number
  overridePrice: number | null
}

function computeLineTotal(line: QuoteLine) {
  const unitPrice = line.overridePrice ?? line.sellingPrice
  const spoilageAmount = line.materialCost * (line.spoilageRate / 100)
  const unitCost =
    line.materialCost + spoilageAmount + line.inkCost + line.overheadCost
  const totalRevenue = unitPrice * line.quantity
  const totalCost = unitCost * line.quantity
  const profit = totalRevenue - totalCost
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
  return { unitPrice, unitCost, totalRevenue, totalCost, profit, margin }
}

function lowestViablePrice(line: QuoteLine, goodThreshold: number): number {
  const spoilageAmount = line.materialCost * (line.spoilageRate / 100)
  const unitCost =
    line.materialCost + spoilageAmount + line.inkCost + line.overheadCost
  if (goodThreshold >= 100) return unitCost * 100
  return unitCost / (1 - goodThreshold / 100)
}

export function QuoteLineEditor({
  lines,
  costProfiles,
  goodThreshold,
  onChange,
}: {
  lines: QuoteLine[]
  costProfiles: CostProfile[]
  goodThreshold: number
  onChange: (lines: QuoteLine[]) => void
}) {
  const [selectedProfileId, setSelectedProfileId] = useState('')

  function addLine() {
    if (!selectedProfileId) return
    const profile = costProfiles.find((p) => p.id === selectedProfileId)
    if (!profile) return
    if (lines.some((l) => l.costProfileId === profile.id)) {
      setSelectedProfileId('')
      return
    }

    const overhead = profile.materialCost * 0.25
    const newLine: QuoteLine = {
      id: crypto.randomUUID(),
      costProfileId: profile.id,
      serviceName: profile.serviceName,
      materialName: profile.materialName,
      quantity: 1,
      materialCost: profile.materialCost,
      inkCost: profile.inkCost,
      overheadCost: overhead,
      spoilageRate: profile.spoilageRate,
      sellingPrice: profile.sellingPrice,
      overridePrice: null,
    }

    onChange([...lines, newLine])
    setSelectedProfileId('')
  }

  function updateLine(id: string, changes: Partial<QuoteLine>) {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...changes } : l)))
  }

  function removeLine(id: string) {
    onChange(lines.filter((l) => l.id !== id))
  }

  const availableProfiles = costProfiles.filter(
    (p) => !lines.some((l) => l.costProfileId === p.id)
  )

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Add Item
          </span>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 dark:text-foreground [&>option]:bg-popover [&>option]:text-popover-foreground"
          >
            <option value="">Select a cost profile...</option>
            {availableProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.serviceName} — {p.materialName}
              </option>
            ))}
          </select>
        </label>
        <Button size="sm" onClick={addLine} disabled={!selectedProfileId}>
          Add
        </Button>
      </div>

      {lines.length > 0 && (
        <div className="border-border/50 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/50 bg-muted/30 text-muted-foreground border-b text-left text-xs">
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                <th className="px-3 py-2 text-right font-medium">Override</th>
                <th className="px-3 py-2 text-right font-medium">Unit Cost</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-right font-medium">Profit</th>
                <th className="px-3 py-2 text-right font-medium">Margin</th>
                <th className="px-3 py-2 text-right font-medium">Lowest</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-border/30 divide-y">
              {lines.map((line) => {
                const computed = computeLineTotal(line)
                const lowest = lowestViablePrice(line, goodThreshold)
                return (
                  <tr key={line.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium">{line.serviceName}</p>
                      <p className="text-muted-foreground text-xs">
                        {line.materialName}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, {
                            quantity: parseFloat(e.target.value) || 1,
                          })
                        }
                        className="ml-auto h-7 w-20 text-right tabular-nums"
                      />
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                      {formatCurrency(line.sellingPrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.overridePrice?.toString() ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateLine(line.id, {
                            overridePrice:
                              val === '' ? null : parseFloat(val) || 0,
                          })
                        }}
                        placeholder="—"
                        className="ml-auto h-7 w-24 text-right tabular-nums"
                      />
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                      {formatCurrency(computed.unitCost)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatCurrency(computed.totalRevenue)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium tabular-nums ${computed.profit >= 0 ? 'text-emerald-400' : 'text-destructive'}`}
                    >
                      {formatCurrency(computed.profit)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {computed.margin.toFixed(1)}%
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right text-xs tabular-nums">
                      {formatCurrency(lowest)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(line.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {lines.length > 0 && (
        <QuoteSummary lines={lines} goodThreshold={goodThreshold} />
      )}
    </div>
  )
}

function QuoteSummary({
  lines,
  goodThreshold: _goodThreshold,
}: {
  lines: QuoteLine[]
  goodThreshold: number
}) {
  let totalRevenue = 0
  let totalCost = 0

  for (const line of lines) {
    const computed = computeLineTotal(line)
    totalRevenue += computed.totalRevenue
    totalCost += computed.totalCost
  }

  const totalProfit = totalRevenue - totalCost
  const overallMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return (
    <div className="border-border/50 bg-muted/30 space-y-2 rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Quote Summary
      </p>
      <div className="grid grid-cols-2 gap-y-1.5 text-sm">
        <span className="text-muted-foreground">Total Selling Price</span>
        <span className="text-right font-medium tabular-nums">
          {formatCurrency(totalRevenue)}
        </span>
        <span className="text-muted-foreground">Total Cost</span>
        <span className="text-right tabular-nums">
          {formatCurrency(totalCost)}
        </span>
        <span className="border-border/50 border-t pt-1.5 font-medium">
          Total Profit
        </span>
        <span
          className={`border-border/50 border-t pt-1.5 text-right font-medium tabular-nums ${totalProfit >= 0 ? 'text-emerald-400' : 'text-destructive'}`}
        >
          {formatCurrency(totalProfit)}
        </span>
        <span className="text-muted-foreground">Overall Margin</span>
        <span className="text-right tabular-nums">
          {overallMargin.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
