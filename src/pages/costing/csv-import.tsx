import { useState, useRef } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
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
import { useImportCostProfiles } from '@/shared/hooks/use-costing'
import type { CostProfileInput } from '@/shared/api/costing.types'
import type {
  CatalogService,
  CatalogMaterial,
} from '@/shared/api/catalog.types'

interface ParsedRow {
  serviceName: string
  materialName: string
  materialCost: number
  inkCost: number
  spoilageRate: number
  serviceId: string | null
  inventoryItemId: string | null
  matched: boolean
}

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  return lines.map((line) => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current.trim())
    return cells
  })
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  service: 'serviceName',
  servicename: 'serviceName',
  servicepapersize: 'serviceName',
  material: 'materialName',
  materialname: 'materialName',
  materialcost: 'materialCost',
  inkcost: 'inkCost',
  spoilagerate: 'spoilageRate',
  spoilage: 'spoilageRate',
}

function findColumnIndex(headers: string[], field: keyof ParsedRow): number {
  return headers.findIndex((h) => HEADER_MAP[normalizeHeader(h)] === field)
}

function matchService(name: string, services: CatalogService[]): string | null {
  const lower = name.toLowerCase()
  const exact = services.find((s) => s.name.toLowerCase() === lower)
  if (exact) return exact.id
  const partial = services.find(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      lower.includes(s.name.toLowerCase())
  )
  return partial?.id ?? null
}

function matchMaterial(
  name: string,
  materials: CatalogMaterial[]
): string | null {
  const lower = name.toLowerCase()
  const exact = materials.find((m) => m.name.toLowerCase() === lower)
  if (exact) return exact.id
  const partial = materials.find(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      lower.includes(m.name.toLowerCase())
  )
  return partial?.id ?? null
}

export function CsvImportDialog({
  services,
  materials,
  trigger,
}: {
  services: CatalogService[]
  materials: CatalogMaterial[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportCostProfiles()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      try {
        const rows = parseCsv(text)
        if (rows.length < 2) {
          setError('CSV file must have a header row and at least one data row.')
          return
        }

        const headers = rows[0]
        const serviceIdx = findColumnIndex(headers, 'serviceName')
        const materialIdx = findColumnIndex(headers, 'materialName')
        const matCostIdx = findColumnIndex(headers, 'materialCost')
        const inkCostIdx = findColumnIndex(headers, 'inkCost')
        const spoilageIdx = findColumnIndex(headers, 'spoilageRate')

        if (serviceIdx === -1 || materialIdx === -1 || matCostIdx === -1) {
          setError(
            'Could not find required columns. Expected: Service Name, Material Name, Material Cost.'
          )
          return
        }

        const parsedRows: ParsedRow[] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (row.length <= Math.max(serviceIdx, materialIdx, matCostIdx))
            continue

          const serviceName = row[serviceIdx]?.trim() ?? ''
          const materialName = row[materialIdx]?.trim() ?? ''
          const materialCost = parseFloat(row[matCostIdx]) || 0
          const inkCost = inkCostIdx >= 0 ? parseFloat(row[inkCostIdx]) || 0 : 0
          const spoilageRate =
            spoilageIdx >= 0 ? parseFloat(row[spoilageIdx]) || 0 : 0

          if (!serviceName || !materialName) continue

          const serviceId = matchService(serviceName, services)
          const inventoryItemId = matchMaterial(materialName, materials)

          parsedRows.push({
            serviceName,
            materialName,
            materialCost,
            inkCost,
            spoilageRate,
            serviceId,
            inventoryItemId,
            matched: !!serviceId && !!inventoryItemId,
          })
        }

        if (parsedRows.length === 0) {
          setError('No valid data rows found in CSV.')
          return
        }

        setParsed(parsedRows)
      } catch {
        setError('Failed to parse CSV file. Please check the format.')
      }
    }
    reader.readAsText(file)
  }

  function handleImport() {
    const matched = parsed.filter((r) => r.matched)
    if (matched.length === 0) return

    const rows: CostProfileInput[] = matched.map((r) => ({
      serviceId: r.serviceId!,
      inventoryItemId: r.inventoryItemId!,
      materialCost: r.materialCost,
      inkCost: r.inkCost,
      spoilageRate: r.spoilageRate,
    }))

    importMutation.mutate(rows, {
      onSuccess: () => {
        setParsed([])
        setOpen(false)
      },
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setParsed([])
      setError(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const matchedCount = parsed.filter((r) => r.matched).length
  const unmatchedCount = parsed.length - matchedCount

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogPopup>
        <DialogTitle>Import Cost Profiles from CSV</DialogTitle>
        <DialogDescription>
          Upload a CSV file with columns: Service Name, Material Name, Material
          Cost, Ink Cost, Spoilage Rate.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="cursor-pointer"
            />
          </div>

          {error && (
            <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-lg border p-3">
              <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {parsed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {matchedCount} matched
                </span>
                {unmatchedCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {unmatchedCount} unmatched
                  </span>
                )}
              </div>

              <div className="border-border/50 max-h-60 overflow-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr className="text-muted-foreground text-left">
                      <th className="px-3 py-2 font-medium">Service</th>
                      <th className="px-3 py-2 font-medium">Material</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Mat. Cost
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Ink Cost
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Spoilage
                      </th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/30 divide-y">
                    {parsed.map((row, i) => (
                      <tr key={i} className={!row.matched ? 'opacity-50' : ''}>
                        <td className="px-3 py-1.5">{row.serviceName}</td>
                        <td className="px-3 py-1.5">{row.materialName}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {row.materialCost}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {row.inkCost}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {row.spoilageRate}%
                        </td>
                        <td className="px-3 py-1.5">
                          {row.matched ? (
                            <span className="text-xs text-emerald-400">
                              Matched
                            </span>
                          ) : (
                            <span className="text-xs text-amber-400">
                              Unmatched
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              size="sm"
              disabled={matchedCount === 0 || importMutation.isPending}
              onClick={handleImport}
            >
              {importMutation.isPending
                ? 'Importing...'
                : `Import ${matchedCount} Profile${matchedCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
