import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDraft } from '@/shared/api/drafts'
import { ProgressStepper } from './progress-stepper'
import { StepServices } from './step-services'
import { StepMaterials } from './step-materials'
import { StepDelivery } from './step-delivery'
import { StepPayment } from './step-payment'
import { OrderSummary } from './order-summary'
import { usePosStore } from '@/stores/pos-store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const STEP_COMPONENTS = [StepServices, StepMaterials, StepDelivery, StepPayment]

export function NewSalePage() {
  const { currentStep, nextStep, prevStep, selectedServices, loadDraft, currentDraftId } = usePosStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const draftId = searchParams.get('draftId')
  const draftLoadedRef = useRef(false)

  const { data: draft, isLoading: isLoadingDraft } = useQuery({
    queryKey: ['draft', draftId],
    queryFn: () => getDraft(draftId!),
    enabled: !!draftId && !draftLoadedRef.current,
  })

  useEffect(() => {
    if (draft && draftId && !draftLoadedRef.current) {
      draftLoadedRef.current = true
      loadDraft(draft.id, draft.draftPayload)
      setSearchParams({}, { replace: true })
    }
  }, [draft, draftId, loadDraft, setSearchParams])

  useEffect(() => {
    if (!draftId) {
      draftLoadedRef.current = false
    }
  }, [draftId])

  const StepComponent = STEP_COMPONENTS[currentStep - 1]

  const canProceed =
    currentStep === 1 ? selectedServices.length > 0 : true

  if (isLoadingDraft) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
