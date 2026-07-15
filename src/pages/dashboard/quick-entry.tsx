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
  useWalletCategories,
  useCreateWalletEntry,
  useCreateWalletCategory,
} from '@/shared/hooks/use-wallet'
import { useAuth } from '@/shared/hooks/use-auth'
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Smartphone,
} from 'lucide-react'
import type { CreateWalletEntryInput } from '@/shared/api/wallet'

const CATEGORY_SELECT_VALUE = '__add_new__'

export function QuickWalletEntry() {
  const { displayName } = useAuth()
  const { data: categories = [] } = useWalletCategories()
  const createEntry = useCreateWalletEntry()
  const createCategory = useCreateWalletCategory()

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  const performedBy = displayName ?? 'Unknown'

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
        setOpen(false)
      },
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  const isPending = createEntry.isPending || createCategory.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-3.5 w-3.5" />
        Add Wallet Entry
      </DialogTrigger>
      <DialogPopup>
        <DialogTitle>Add Wallet Entry</DialogTitle>
        <DialogDescription>
          Record an expense or income entry not from sales.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setType('expense') }}
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
              onClick={() => { setType('income') }}
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

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              required
            />
          </label>

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

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Payment Method</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  paymentMethod === 'cash'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Banknote className="mr-1 inline h-3.5 w-3.5" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  paymentMethod === 'gcash'
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Smartphone className="mr-1 inline h-3.5 w-3.5" />
                GCash
              </button>
            </div>
          </label>

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
