import { usePosStore } from '@/stores/pos-store'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Truck, Percent, DollarSign, MapPin, User } from 'lucide-react'

export function StepDelivery() {
  const {
    delivery,
    setDeliveryEnabled,
    setDeliveryField,
    discount,
    setDiscountType,
    setDiscountValue,
  } = usePosStore()

  return (
    <div className="space-y-8">
      {/* Delivery section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Delivery</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Enable if this order needs delivery.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Truck className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Enable Delivery</p>
              <p className="text-xs text-muted-foreground">
                Adds delivery details and fee
              </p>
            </div>
          </div>
          <Switch
            checked={delivery.enabled}
            onCheckedChange={setDeliveryEnabled}
          />
        </div>

        {/* Delivery form — animated expand */}
        <div
          className={cn(
            'grid transition-all duration-300 ease-out',
            delivery.enabled
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
              {/* Customer name */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <User className="h-3 w-3" />
                  Customer Name
                </label>
                <Input
                  placeholder="Full name"
                  value={delivery.customerName}
                  onChange={(e) =>
                    setDeliveryField('customerName', e.target.value)
                  }
                  className="h-11"
                />
              </div>

              {/* Address */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Delivery Address
                </label>
                <Input
                  placeholder="Street, barangay, city"
                  value={delivery.address}
                  onChange={(e) =>
                    setDeliveryField('address', e.target.value)
                  }
                  className="h-11"
                />
              </div>

              {/* Delivery fee */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Delivery Fee (₱)
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={delivery.fee || ''}
                  onChange={(e) =>
                    setDeliveryField('fee', parseFloat(e.target.value) || 0)
                  }
                  className="h-11 text-base font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discount section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Discount</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Apply an order-level discount.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          {/* Discount type toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setDiscountType('amount')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all duration-150',
                discount.type === 'amount'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Fixed Amount
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('percentage')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all duration-150',
                discount.type === 'percentage'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Percent className="h-3.5 w-3.5" />
              Percentage
            </button>
          </div>

          {/* Discount value */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {discount.type === 'amount'
                ? 'Discount Amount (₱)'
                : 'Discount Percentage (%)'}
            </label>
            <Input
              type="number"
              min={0}
              max={discount.type === 'percentage' ? 100 : undefined}
              placeholder="0"
              value={discount.value || ''}
              onChange={(e) =>
                setDiscountValue(parseFloat(e.target.value) || 0)
              }
              className="h-12 text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
