import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDrafts, deleteDraft } from '@/shared/api/drafts'
import type { DraftRecord } from '@/shared/api/drafts.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  FileText,
  Search,
  MoreHorizontal,
  PlayCircle,
  Trash2,
  ShoppingBag,
  Loader2,
} from 'lucide-react'

function formatDraftDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' · ' + new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getDraftServiceNames(draft: DraftRecord): string[] {
  return (draft.draftPayload.selectedServices ?? []).map((ss) => ss.service?.name ?? 'Unknown')
}

function getDraftLabel(draft: DraftRecord): string {
  return draft.draftPayload.name || `DRF-${draft.transactionNumber.slice(-4)}`
}

function DraftCard({
  draft,
  onResume,
  onDeleteRequest,
}: {
  draft: DraftRecord
  onResume: (id: string) => void
  onDeleteRequest: (draft: DraftRecord) => void
}) {
  const services = getDraftServiceNames(draft)
  const label = getDraftLabel(draft)
  const hasCustomName = !!draft.draftPayload.name

  return (
    <div
      className="flex items-center justify-between py-3.5 transition-default hover:bg-muted/30 px-2 -mx-2 rounded-lg cursor-pointer"
      onClick={() => onResume(draft.id)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">
            {label}
          </p>
          {hasCustomName && (
            <span className="text-[11px] text-muted-foreground font-mono">
              DRF-{draft.transactionNumber.slice(-4)}
            </span>
          )}
          <Badge variant="outline" className="text-[10px] shrink-0">Draft</Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {services.join(', ') || 'No services'} · {draft.cashierName}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">₱{draft.finalTotal.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">{formatDraftDate(draft.createdAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onResume(draft.id)
              }}
            >
              <PlayCircle className="h-4 w-4" />
              Resume Draft
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteRequest(draft)
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function DraftsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DraftRecord | null>(null)

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['drafts'],
    queryFn: getDrafts,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['drafts'] })
      const previous = queryClient.getQueryData<DraftRecord[]>(['drafts'])
      queryClient.setQueryData<DraftRecord[]>(['drafts'], (old) =>
        old?.filter((d) => d.id !== id)
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['drafts'], context.previous)
      }
      toast.error('Failed to delete draft')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
    },
  })

  const handleResume = (id: string) => {
    navigate(`/new-sale?draftId=${id}`)
  }

  const handleDeleteRequest = (draft: DraftRecord) => {
    setDeleteTarget(draft)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const filteredDrafts = (drafts ?? []).filter((draft) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const services = getDraftServiceNames(draft).join(' ').toLowerCase()
    const number = `DRF-${draft.transactionNumber.slice(-4)}`.toLowerCase()
    const cashier = draft.cashierName.toLowerCase()
    const name = (draft.draftPayload.name || '').toLowerCase()
    return services.includes(q) || number.includes(q) || cashier.includes(q) || name.includes(q)
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Drafts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resume or discard previously saved transactions.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search drafts…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-brand" />
            All Drafts
            {drafts && drafts.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {drafts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-3 w-28 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium text-muted-foreground/60">
                {search ? 'No drafts match your search' : 'No saved drafts'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/40">
                {search ? 'Try a different search term' : 'Save a draft from the New Sale page'}
              </p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/40">
              {filteredDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onResume={handleResume}
                  onDeleteRequest={handleDeleteRequest}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogPopup>
          <DialogTitle>Delete Draft</DialogTitle>
          <DialogDescription className="mt-1.5">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {deleteTarget ? getDraftLabel(deleteTarget) : ''}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="gap-1.5"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
