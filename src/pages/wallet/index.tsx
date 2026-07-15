import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  useWalletSummary,
  useWalletTransactions,
  useWalletEntries,
  useWalletCategories,
  useDeleteWalletEntry,
  useCreateWalletEntry,
  useCreateWalletCategory,
  useSetBalanceOverride,
  useClearBalanceOverride,
} from '@/shared/hooks/use-wallet'
import { useActivityLogs } from '@/shared/hooks/use-audit-log'
import { useAuth } from '@/shared/hooks/use-auth'
import {
  Banknote,
  Smartphone,
  Wallet as WalletIcon,
  Plus,
  Trash2,
  Pencil,
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ScrollText,
  ShieldCheck,
} from 'lucide-react'
import type { WalletEntry, CreateWalletEntryInput } from '@/shared/api/wallet'
import type { ActivityLogEntry, ActivityAction } from '@/shared/api/audit-log'

// ─── Balance Card (editable via dialog) ───────────────────────────────────────

function BalanceCard({
  label,
  icon,
  color,
  computedAmount,
  overrideAmount,
  entriesNet,
  onSetOverride,
  onClearOverride,
  isSaving,
}: {
  label: string
  icon: React.ReactNode
  color: 'emerald' | 'blue'
  computedAmount: number
  overrideAmount: number | null
  entriesNet: number
  onSetOverride: (amount: number) => void
  onClearOverride: () => void
  isSaving: boolean
}) {
  const [open, setOpen] = useState(false)
  const [editValue, setEditValue] = useState('')

  const baseAmount = overrideAmount ?? computedAmount
  const displayAmount = baseAmount + entriesNet
  const hasOverride = overrideAmount !== null

  const colorClasses = {
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      iconBg: 'bg-emerald-500/15',
      iconText: 'text-emerald-400',
      labelText: 'text-emerald-400/80',
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      iconBg: 'bg-blue-500/15',
      iconText: 'text-blue-400',
      labelText: 'text-blue-400/80',
    },
  }

  const c = colorClasses[color]

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setEditValue(displayAmount.toString())
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(editValue)
    if (!isNaN(val) && val >= 0) {
      onSetOverride(val)
      setOpen(false)
    }
  }

  return (
    <div className={cn('rounded-xl border p-5', c.border, c.bg)}>
      <div className="flex items-center gap-2.5">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', c.iconBg)}>
          <div className={c.iconText}>{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn('text-xs font-medium', c.labelText)}>{label}</p>
            {hasOverride && (
              <span className="text-[10px] text-amber-400 font-medium">(override)</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold tabular-nums text-foreground">
              ₱{displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger render={<Button variant="ghost" size="icon-xs" />}>
                <Pencil className="h-3 w-3" />
              </DialogTrigger>
              <DialogPopup>
                <DialogTitle>Override {label} Balance</DialogTitle>
                <DialogDescription>
                  Set a custom balance for {label}. This overrides the computed value (₱{computedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).
                </DialogDescription>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">New Balance (₱)</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                      required
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    <div>
                      {hasOverride && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            onClearOverride()
                            setOpen(false)
                          }}
                        >
                          Remove Override
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>
                        Cancel
                      </DialogClose>
                      <Button type="submit" size="sm" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogPopup>
            </Dialog>
            {hasOverride && (
              <button
                onClick={onClearOverride}
                className="rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Clear override"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Simple Balance Card (non-editable) ───────────────────────────────────────

function TotalBalanceCard({ amount }: { amount: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <WalletIcon className="h-4.5 w-4.5 text-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total</p>
          <p className="text-xl font-bold tabular-nums text-foreground">
            ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Add Entry Dialog ─────────────────────────────────────────────────────────

const CATEGORY_SELECT_VALUE = '__add_new__'

function AddEntryDialog({
  categories,
  open,
  onOpenChange,
  performedBy,
}: {
  categories: { id: string; name: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
  performedBy: string
}) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  const createEntry = useCreateWalletEntry()
  const createCategory = useCreateWalletCategory()

  function resetForm() {
    setType('expense')
    setAmount('')
    setDescription('')
    setCategoryId('')
    setPaymentMethod('cash')
    setEntryDate(new Date().toISOString().slice(0, 10))
    setNewCategoryName('')
    setShowNewCategory(false)
  }

  function handleCategoryChange(value: string) {
    if (value === CATEGORY_SELECT_VALUE) {
      setShowNewCategory(true)
      setCategoryId('')
    } else {
      setShowNewCategory(false)
      setCategoryId(value)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0 || !description.trim()) return

    let finalCategoryId = categoryId || null

    if (showNewCategory && newCategoryName.trim()) {
      try {
        const newCat = await createCategory.mutateAsync(newCategoryName.trim())
        finalCategoryId = newCat.id
      } catch {
        return
      }
    }

    const entry: CreateWalletEntryInput & { performedBy: string } = {
      type,
      amount: parsedAmount,
      description: description.trim(),
      categoryId: finalCategoryId,
      paymentMethod,
      entryDate,
      performedBy,
    }

    createEntry.mutate(entry, {
      onSuccess: () => {
        resetForm()
        onOpenChange(false)
      },
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) resetForm()
  }

  const isPending = createEntry.isPending || createCategory.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogTitle>Add Entry</DialogTitle>
        <DialogDescription>
          Record an expense or income entry not from sales.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                type === 'expense'
                  ? 'border-red-500/40 bg-red-500/10 text-red-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowDownRight className="mr-1 inline h-3.5 w-3.5" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                type === 'income'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowUpRight className="mr-1 inline h-3.5 w-3.5" />
              Income
            </button>
          </div>

          {/* Amount */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Amount (₱)</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>

          {/* Description */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              required
            />
          </label>

          {/* Category */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Category</span>
            <select
              value={showNewCategory ? CATEGORY_SELECT_VALUE : categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option value={CATEGORY_SELECT_VALUE}>+ Add custom...</option>
            </select>
          </label>

          {showNewCategory && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">New Category Name</span>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
              />
            </label>
          )}

          {/* Payment method */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Payment Method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'gcash')}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
          </label>

          {/* Date */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Date</span>
            <Input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !amount || !description.trim()}
            >
              {isPending ? 'Saving...' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}

// ─── Delete Entry Dialog ──────────────────────────────────────────────────────

function DeleteEntryDialog({
  entry,
  isPending,
  onConfirm,
}: {
  entry: WalletEntry
  isPending: boolean
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="icon-xs" />}>
        <Trash2 className="h-3 w-3" />
      </DialogTrigger>
      <DialogPopup>
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this {entry.type} of ₱{entry.amount.toLocaleString()}?
        </DialogDescription>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
        </div>
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

// ─── Entries Table ────────────────────────────────────────────────────────────

function EntriesTable({
  entries,
  isLoading,
  onDelete,
  isDeleting,
}: {
  entries: WalletEntry[]
  isLoading: boolean
  onDelete: (id: string, entry: WalletEntry) => void
  isDeleting: boolean
}) {
  const [filter, setFilter] = useState<'all' | 'cash' | 'gcash'>('all')

  const filtered = filter === 'all'
    ? entries
    : entries.filter((e) => e.paymentMethod === filter)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Entries</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'cash' | 'gcash')}
          className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs"
        >
          <option value="all">All</option>
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border/30 last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {entry.entryDate}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        entry.type === 'income'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      )}
                    >
                      {entry.type === 'income' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {entry.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {entry.categoryName || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-foreground text-xs">
                    {entry.description}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        entry.paymentMethod === 'cash'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-blue-500/15 text-blue-400'
                      )}
                    >
                      {entry.paymentMethod === 'cash' ? (
                        <Banknote className="h-3 w-3" />
                      ) : (
                        <Smartphone className="h-3 w-3" />
                      )}
                      {entry.paymentMethod === 'cash' ? 'Cash' : 'GCash'}
                    </span>
                  </td>
                  <td className={cn(
                    'px-4 py-2.5 text-right font-semibold tabular-nums',
                    entry.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {entry.type === 'income' ? '+' : '-'}₱{entry.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DeleteEntryDialog
                      entry={entry}
                      isPending={isDeleting}
                      onConfirm={() => onDelete(entry.id, entry)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Transactions Table ───────────────────────────────────────────────────────

function TransactionsTable({
  transactions,
  isLoading,
}: {
  transactions: {
    id: string
    transactionNumber: string
    finalTotal: number
    paymentMethod: 'cash' | 'gcash'
    completedAt: string
    customerName: string | null
  }[]
  isLoading: boolean
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Recent Completed Sales
      </h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No completed sales yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Transaction</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/30 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    #{tx.transactionNumber}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">
                    {tx.customerName || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        tx.paymentMethod === 'cash'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-blue-500/15 text-blue-400'
                      )}
                    >
                      {tx.paymentMethod === 'cash' ? (
                        <Banknote className="h-3 w-3" />
                      ) : (
                        <Smartphone className="h-3 w-3" />
                      )}
                      {tx.paymentMethod === 'cash' ? 'Cash' : 'GCash'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                    ₱{tx.finalTotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ActivityAction, { label: string; color: string; icon: React.ReactNode }> = {
  balance_override_set: {
    label: 'Override set',
    color: 'text-amber-400',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  balance_override_cleared: {
    label: 'Override cleared',
    color: 'text-amber-400/70',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  expense_added: {
    label: 'Expense added',
    color: 'text-red-400',
    icon: <ArrowDownRight className="h-3.5 w-3.5" />,
  },
  income_added: {
    label: 'Income added',
    color: 'text-emerald-400',
    icon: <ArrowUpRight className="h-3.5 w-3.5" />,
  },
  entry_deleted: {
    label: 'Entry deleted',
    color: 'text-muted-foreground',
    icon: <Trash2 className="h-3.5 w-3.5" />,
  },
}

function formatLogTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHrs = Math.floor(diffMs / 3_600_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function ActivityLog({ logs, isLoading }: { logs: ActivityLogEntry[]; isLoading: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Activity Log</h2>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const config = ACTION_CONFIG[log.action]
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3"
              >
                <div className={cn('mt-0.5 shrink-0', config.color)}>
                  {config.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {log.performedBy}
                    </span>
                    <span className={cn('text-xs font-medium', config.color)}>
                      {config.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {log.paymentMethod && (
                      <span className="inline-flex items-center gap-1">
                        {log.paymentMethod === 'cash' ? (
                          <Banknote className="h-3 w-3" />
                        ) : (
                          <Smartphone className="h-3 w-3" />
                        )}
                        {log.paymentMethod === 'cash' ? 'Cash' : 'GCash'}
                      </span>
                    )}
                    {log.amount != null && (
                      <span className="font-semibold tabular-nums">
                        ₱{log.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {log.description && (
                      <span className="truncate">{log.description}</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground/70">
                  {formatLogTime(log.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WalletPage() {
  const { displayName } = useAuth()
  const { data: summary, isLoading: loadingSummary } = useWalletSummary()
  const { data: transactions, isLoading: loadingTx } = useWalletTransactions()
  const { data: entries = [], isLoading: loadingEntries } = useWalletEntries()
  const { data: categories = [] } = useWalletCategories()
  const { data: activityLogs = [], isLoading: loadingLogs } = useActivityLogs()

  const deleteEntry = useDeleteWalletEntry()
  const setOverride = useSetBalanceOverride()
  const clearOverride = useClearBalanceOverride()

  const [addEntryOpen, setAddEntryOpen] = useState(false)

  const performedBy = displayName ?? 'Unknown'

  if (loadingSummary) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <WalletIcon className="h-6 w-6 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  const cashComputed = summary?.cashTotal ?? 0
  const gcashComputed = summary?.gcashTotal ?? 0
  const cashEntriesNet = summary?.cashEntriesNet ?? 0
  const gcashEntriesNet = summary?.gcashEntriesNet ?? 0
  const cashOverride = summary?.cashOverride ?? null
  const gcashOverride = summary?.gcashOverride ?? null

  const cashSales = cashComputed - cashEntriesNet
  const gcashSales = gcashComputed - gcashEntriesNet

  const displayCash = (cashOverride ?? cashSales) + cashEntriesNet
  const displayGcash = (gcashOverride ?? gcashSales) + gcashEntriesNet
  const displayCombined = displayCash + displayGcash

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment balances from completed sales and manual entries.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddEntryOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Entry
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <BalanceCard
          label="Cash"
          icon={<Banknote className="h-4.5 w-4.5" />}
          color="emerald"
          computedAmount={cashSales}
          overrideAmount={cashOverride}
          entriesNet={cashEntriesNet}
          onSetOverride={(amount) => setOverride.mutate({ paymentMethod: 'cash', amount, performedBy })}
          onClearOverride={() => clearOverride.mutate({ paymentMethod: 'cash', performedBy })}
          isSaving={setOverride.isPending}
        />
        <BalanceCard
          label="GCash"
          icon={<Smartphone className="h-4.5 w-4.5" />}
          color="blue"
          computedAmount={gcashSales}
          overrideAmount={gcashOverride}
          entriesNet={gcashEntriesNet}
          onSetOverride={(amount) => setOverride.mutate({ paymentMethod: 'gcash', amount, performedBy })}
          onClearOverride={() => clearOverride.mutate({ paymentMethod: 'gcash', performedBy })}
          isSaving={setOverride.isPending}
        />
        <TotalBalanceCard amount={displayCombined} />
      </div>

      {/* Entries */}
      <EntriesTable
        entries={entries}
        isLoading={loadingEntries}
        onDelete={(id, entry) => deleteEntry.mutate({ id, entry, performedBy })}
        isDeleting={deleteEntry.isPending}
      />

      {/* Transactions */}
      <TransactionsTable transactions={transactions ?? []} isLoading={loadingTx} />

      {/* Activity Log */}
      <ActivityLog logs={activityLogs} isLoading={loadingLogs} />

      {/* Add Entry Dialog */}
      <AddEntryDialog
        categories={categories}
        open={addEntryOpen}
        onOpenChange={setAddEntryOpen}
        performedBy={performedBy}
      />
    </div>
  )
}
