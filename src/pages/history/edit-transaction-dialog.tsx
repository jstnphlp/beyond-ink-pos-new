import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateTransaction } from './use-history-query'
import { X } from 'lucide-react'
import type { TransactionDetail, UpdateTransactionPayload } from '@/shared/api/history.types'

interface EditTransactionDialogProps {
  transaction: TransactionDetail
  onClose: () => void
}

export function EditTransactionDialog({ transaction, onClose }: EditTransactionDialogProps) {
  const updateMutation = useUpdateTransaction()

  const [customerName, setCustomerName] = useState(transaction.customerName ?? '')
  const [deliveryAddress, setDeliveryAddress] = useState(transaction.deliveryAddress ?? '')
  const [deliveryFee, setDeliveryFee] = useState(String(transaction.deliveryFee))
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage' | ''>(
    transaction.discountType ?? ''
  )
  const [discountValue, setDiscountValue] = useState(
    transaction.discountValue != null ? String(transaction.discountValue) : ''
  )
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | ''>(
    transaction.paymentMethod ?? ''
  )
  const [status, setStatus] = useState<'completed' | 'cancelled'>(transaction.status)

  useEffect(() => {
    setCustomerName(transaction.customerName ?? '')
    setDeliveryAddress(transaction.deliveryAddress ?? '')
    setDeliveryFee(String(transaction.deliveryFee))
    setDiscountType(transaction.discountType ?? '')
    setDiscountValue(transaction.discountValue != null ? String(transaction.discountValue) : '')
    setPaymentMethod(transaction.paymentMethod ?? '')
    setStatus(transaction.status)
  }, [transaction])

  const handleSave = () => {
    const payload: UpdateTransactionPayload = {
      customerName: customerName.trim() || null,
      deliveryAddress: deliveryAddress.trim() || null,
      deliveryFee: Number(deliveryFee) || 0,
      discountType: discountType || null,
      discountValue: discountValue ? Number(discountValue) : null,
      paymentMethod: paymentMethod || null,
      status,
    }

    updateMutation.mutate(
      { id: transaction.id, payload },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogPopup className="fixed right-0 top-0 h-full w-full max-w-md translate-x-0 translate-y-0 left-auto rounded-none border-l [&[data-open]]:!animate-none [&[data-closed]]:!animate-none">
        <div className="flex items-center justify-between">
          <DialogTitle>
            Edit TXN-{transaction.transactionNumber.slice(-4)}
          </DialogTitle>
          <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <div className="mt-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'completed' | 'cancelled')}
              className="h-8 w-full rounded-lg border border-input bg-popover px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Customer Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Delivery Address</label>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="None"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Delivery Fee</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage' | '')}
                className="h-8 w-full rounded-lg border border-input bg-popover px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Discount Value</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                disabled={!discountType}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'gcash' | '')}
              className="h-8 w-full rounded-lg border border-input bg-popover px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">None</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
          </div>

          <div className="flex gap-2 border-t border-border/40 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
