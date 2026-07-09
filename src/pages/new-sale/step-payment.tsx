import { usePosStore } from '@/stores/pos-store'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Banknote, Smartphone, ArrowDownLeft, Users } from 'lucide-react'
import { useStaffMembers } from '@/shared/hooks/use-staff'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { StaffMember } from '@/shared/api/staff.types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ContributorSelector() {
  const { selectedServices, contributors, setContributors } = usePosStore()
  const { data: members } = useStaffMembers()

  const hasDesignOrDev = selectedServices.some(
    (ss) => ss.service.department === 'Design' || ss.service.department === 'Dev'
  )

  if (!hasDesignOrDev) return null

  const relevantDepts = new Set<string>(
    selectedServices
      .filter((ss) => ss.service.department === 'Design' || ss.service.department === 'Dev')
      .map((ss) =>
        ss.service.department === 'Design' ? 'design_dept' : 'dev_dept'
      )
  )

  const available = (members ?? []).filter(
    (m) => m.department && relevantDepts.has(m.department)
  )

  const selectedIds = new Set(contributors.map((c) => c.id))

  function toggle(member: StaffMember) {
    if (selectedIds.has(member.id)) {
      setContributors(contributors.filter((c) => c.id !== member.id))
    } else {
      setContributors([...contributors, member])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Contributors</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Select staff who contributed to this sale for revenue distribution.
      </p>

      {available.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 py-4 text-center text-xs text-muted-foreground">
          No staff members found for Design/Dev departments.
        </p>
      ) : (
        <div className="space-y-1.5">
          {available.map((member) => {
            const isSelected = selectedIds.has(member.id)
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggle(member)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
                  isSelected
                    ? 'border-brand/40 bg-brand/5'
                    : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
                )}
              >
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                    isSelected
                      ? 'border-brand bg-brand text-white'
                      : 'border-muted-foreground/40 bg-transparent'
                  )}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarFallback className="bg-muted text-[10px] font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {member.department === 'design_dept' ? 'Design' : 'Dev'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function StepPayment() {
  const {
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,
    getTotal,
    getChangeDue,
  } = usePosStore()

  const total = getTotal()
  const changeDue = getChangeDue()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Payment</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select a payment method and complete the transaction.
        </p>
      </div>

      {/* Amount Due Banner */}
      <div className="rounded-xl border border-border/60 bg-card p-5 text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Amount Due
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          ₱{total.toLocaleString()}
        </p>
      </div>

      {/* Contributor Selector (Design/Dev only) */}
      <ContributorSelector />

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cash */}
        <button
          type="button"
          onClick={() => setPaymentMethod('cash')}
          className={cn(
            'group relative flex flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-200',
            paymentMethod === 'cash'
              ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
              : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
          )}
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
              paymentMethod === 'cash'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-muted text-muted-foreground group-hover:text-foreground'
            )}
          >
            <Banknote className="h-7 w-7" />
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              paymentMethod === 'cash'
                ? 'text-emerald-400'
                : 'text-foreground'
            )}
          >
            Cash
          </span>
        </button>

        {/* GCash */}
        <button
          type="button"
          onClick={() => setPaymentMethod('gcash')}
          className={cn(
            'group relative flex flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-200',
            paymentMethod === 'gcash'
              ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20'
              : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
          )}
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
              paymentMethod === 'gcash'
                ? 'bg-blue-500/15 text-blue-400'
                : 'bg-muted text-muted-foreground group-hover:text-foreground'
            )}
          >
            <Smartphone className="h-7 w-7" />
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              paymentMethod === 'gcash' ? 'text-blue-400' : 'text-foreground'
            )}
          >
            GCash
          </span>
        </button>
      </div>

      {/* Cash Received + Change */}
      {paymentMethod === 'cash' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Banknote className="h-3 w-3" />
              Cash Received (₱)
            </label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={cashReceived || ''}
              onChange={(e) =>
                setCashReceived(parseFloat(e.target.value) || 0)
              }
              onWheel={(e) => e.currentTarget.blur()}
              className="input-numeric border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
          </div>

          {/* Change Due */}
          {cashReceived > 0 && (
            <div
              className={cn(
                'rounded-xl border p-5 text-center transition-all',
                cashReceived >= total
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-destructive/30 bg-destructive/5'
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <ArrowDownLeft
                  className={cn(
                    'h-4 w-4',
                    cashReceived >= total
                      ? 'text-emerald-400'
                      : 'text-destructive'
                  )}
                />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {cashReceived >= total ? 'Change Due' : 'Insufficient'}
                </span>
              </div>
              <p
                className={cn(
                  'mt-1 text-3xl font-bold tracking-tight tabular-nums',
                  cashReceived >= total
                    ? 'text-emerald-400'
                    : 'text-destructive'
                )}
              >
                ₱{changeDue.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* GCash confirmation */}
      {paymentMethod === 'gcash' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 text-center">
            <Smartphone className="mx-auto h-6 w-6 text-blue-400" />
            <p className="mt-2 text-sm font-medium text-foreground">
              GCash Payment — ₱{total.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Confirm the payment has been received before completing.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
