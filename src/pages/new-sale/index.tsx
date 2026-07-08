import { ProgressStepper } from './progress-stepper'
import { StepServices } from './step-services'
import { StepMaterials } from './step-materials'
import { StepDelivery } from './step-delivery'
import { StepPayment } from './step-payment'
import { OrderSummary } from './order-summary'
import { usePosStore } from '@/stores/pos-store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const STEP_COMPONENTS = [StepServices, StepMaterials, StepDelivery, StepPayment]

export function NewSalePage() {
  const { currentStep, nextStep, prevStep, selectedServices } = usePosStore()
  const StepComponent = STEP_COMPONENTS[currentStep - 1]

  const canProceed =
    currentStep === 1 ? selectedServices.length > 0 : true

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Pane — Wizard (60%) */}
      <div className="flex w-[60%] flex-col border-r border-border">
        {/* Stepper */}
        <div className="shrink-0 border-b border-border px-6 py-4">
          <ProgressStepper />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6">
          <StepComponent />
        </div>

        {/* Navigation buttons */}
        <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
          <Button
            variant="outline"
            size="lg"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          {currentStep < 4 && (
            <Button
              size="lg"
              onClick={nextStep}
              disabled={!canProceed}
              className="gap-1.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Right Pane — Order Summary (40%) */}
      <div className="w-[40%]">
        <OrderSummary />
      </div>
    </div>
  )
}
