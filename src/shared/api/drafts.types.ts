import type { Service, DeliveryInfo, Discount } from '@/stores/pos-store'

export interface DraftPayload {
  name?: string
  currentStep: number
  selectedServices: Array<{
    service: Service
    materialId: string | null
    quantity: number
  }>
  delivery: DeliveryInfo
  discount: Discount
  cashierName: string
  department: string
  savedAt: string
}

export interface DraftRecord {
  id: string
  transactionNumber: string
  cashierName: string
  department: string
  draftPayload: DraftPayload
  subtotal: number
  finalTotal: number
  createdAt: string
  updatedAt: string
}
