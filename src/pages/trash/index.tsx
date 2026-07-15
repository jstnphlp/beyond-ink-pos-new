import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  useDeletedRecords,
  useDistinctTableNames,
  useRestoreDeletedRecord,
} from '@/shared/hooks/use-deleted-records'
import {
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Database,
  AlertTriangle,
} from 'lucide-react'
import type { DeletedRecord } from '@/shared/api/deleted-records'

const PAGE_SIZE = 20

function formatTableName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function dataPreview(data: Record<string, unknown>): string {
  const preferred = ['name', 'description', 'title', 'key', 'staff_name', 'customer_name', 'action']
  for (const key of preferred) {
    if (data[key] != null && String(data[key]).trim()) {
      const val = String(data[key])
      return val.length > 60 ? val.slice(0, 57) + '…' : val
    }
  }
  return '—'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Restore Dialog ──────────────────────────────────────────────────────────

function RestoreDialog({
  record,
}: {
  record: DeletedRecord
}) {
  const restore = useRestoreDeletedRecord()
  const [open, setOpen] = useState(false)

  const handleRestore = useCallback(() => {
    restore.mutate(
      { tableName: record.tableName, recordId: record.recordId },
      { onSuccess: () => setOpen(false) }
    )
  }, [record, restore])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted" />}>
        <RotateCcw className="h-3 w-3" />
        Restore
      </DialogTrigger>
      <DialogPopup className="max-w-md">
        <DialogTitle>Restore Record</DialogTitle>
        <DialogDescription>
          This will re-insert the deleted row into{' '}
          <span className="font-medium text-foreground">
            {formatTableName(record.tableName)}
          </span>
          .
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border bg-muted/50 p-3 text-xs">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <Database className="h-3.5 w-3.5" />
              <span>Data Preview</span>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-muted-foreground">
              {JSON.stringify(record.data, null, 2)}
            </pre>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              If this record has foreign-key dependencies that were also deleted,
              restoring may fail. Restore parent records first.
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <DialogClose
            render={
              <button className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted" />
            }
          >
            Cancel
          </DialogClose>
          <Button
            onClick={handleRestore}
            disabled={restore.isPending}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {restore.isPending ? 'Restoring…' : 'Restore'}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function TrashPage() {
  const [filter, setFilter] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching } = useDeletedRecords(
    filter ?? undefined,
    page,
    PAGE_SIZE
  )
  const { data: tableNames = [] } = useDistinctTableNames()

  const records = data?.records ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleted records are kept for 30 days. Restore any row before it is
          purged.
        </p>
      </div>

      {/* Table name filter */}
      {tableNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-muted p-[3px]">
            <button
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:px-3',
                filter === null
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => {
                setFilter(null)
                setPage(0)
              }}
            >
              All
            </button>
            {tableNames.map((name) => (
              <button
                key={name}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors md:px-3',
                  filter === name
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => {
                  setFilter(name)
                  setPage(0)
                }}
              >
                {formatTableName(name)}
              </button>
            ))}
          </div>
          {isFetching && (
            <span className="text-xs text-muted-foreground">Loading…</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Record</th>
              <th className="hidden px-4 py-3 md:table-cell">Preview</th>
              <th className="px-4 py-3">Deleted</th>
              <th className="hidden px-4 py-3 sm:table-cell">By</th>
              <th className="w-px px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton className="ml-auto h-7 w-16" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  <Trash2 className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">No deleted records found.</p>
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {formatTableName(rec.tableName)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {rec.recordId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="hidden max-w-[260px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                    {dataPreview(rec.data)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(rec.deletedAt)}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                    {rec.deletedBy ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RestoreDialog record={rec} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total} record{total !== 1 ? 's' : ''} · Page {page + 1} of{' '}
            {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
