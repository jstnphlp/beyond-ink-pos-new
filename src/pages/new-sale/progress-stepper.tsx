import { usePosStore } from '@/stores/pos-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Services' },
  { number: 2, label: 'Materials & Add-ons' },
  { number: 3, label: 'Delivery & Discount' },
  { number: 4, label: 'Payment' },
]

export function ProgressStepper() {
  const currentStep = usePosStore((s) => s.currentStep)

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep

        return (
          <div key={step.number} className="flex items-center gap-1 flex-1">
            {/* Step indicator */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  isCompleted &&
                    'bg-brand text-brand-foreground',
                  isActive &&
                    'bg-foreground text-background ring-4 ring-foreground/10',
                  !isActive &&
                    !isCompleted &&
                    'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium truncate transition-colors',
                  isActive && 'text-foreground',
                  isCompleted && 'text-brand',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="mx-2 h-px flex-1">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isCompleted ? 'bg-brand' : 'bg-border'
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
