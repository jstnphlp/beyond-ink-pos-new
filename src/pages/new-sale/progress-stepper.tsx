import { usePosStore } from '@/stores/pos-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Category' },
  { number: 2, label: 'Services' },
  { number: 3, label: 'Materials' },
  { number: 4, label: 'Delivery & Discount' },
  { number: 5, label: 'Payment' },
]

export function ProgressStepper() {
  const currentStep = usePosStore((s) => s.currentStep)
  const setStep = usePosStore((s) => s.setStep)

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep
        const isClickable = isCompleted || isActive

        return (
          <div key={step.number} className="flex items-center gap-1 flex-1">
            {/* Step indicator */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => setStep(step.number)}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default',
                  isCompleted &&
                    'bg-brand text-brand-foreground hover:opacity-80',
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
              </button>
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
