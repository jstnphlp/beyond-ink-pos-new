import { usePosStore } from '@/stores/pos-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Category', short: 'Cat' },
  { number: 2, label: 'Services', short: 'Svcs' },
  { number: 3, label: 'Materials', short: 'Mats' },
  { number: 4, label: 'Delivery & Discount', short: 'Del' },
  { number: 5, label: 'Payment', short: 'Pay' },
]

export function ProgressStepper() {
  const currentStep = usePosStore((s) => s.currentStep)
  const setStep = usePosStore((s) => s.setStep)

  return (
    <div className="flex items-center gap-0.5 md:gap-1">
      {STEPS.map((step, idx) => {
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep
        const isClickable = isCompleted || isActive

        return (
          <div key={step.number} className="flex items-center gap-0.5 md:gap-1 flex-1 min-w-0">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => setStep(step.number)}
                className={cn(
                  'flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full text-[10px] md:text-xs font-bold transition-all duration-300',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default',
                  isCompleted &&
                    'bg-brand text-brand-foreground hover:opacity-80',
                  isActive &&
                    'bg-foreground text-background ring-2 md:ring-4 ring-foreground/10',
                  !isActive &&
                    !isCompleted &&
                    'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 md:h-3.5 md:w-3.5" />
                ) : (
                  step.number
                )}
              </button>
              <span
                className={cn(
                  'text-[10px] md:text-xs font-medium truncate transition-colors hidden sm:block',
                  isActive && 'text-foreground',
                  isCompleted && 'text-brand',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium truncate transition-colors sm:hidden',
                  isActive && 'text-foreground',
                  isCompleted && 'text-brand',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                {step.short}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="mx-0.5 md:mx-2 h-px flex-1">
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
