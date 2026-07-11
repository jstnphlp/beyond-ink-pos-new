export interface CostProfile {
  id: string
  serviceId: string
  inventoryItemId: string
  materialCost: number
  inkCost: number
  spoilageRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  serviceName: string
  materialName: string
  sellingPrice: number
}

export interface CostProfileInput {
  serviceId: string
  inventoryItemId: string
  materialCost: number
  inkCost: number
  spoilageRate: number
}

export interface Quote {
  id: string
  name: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  lineItemCount: number
}

export interface QuoteLineItem {
  id: string
  quoteId: string
  costProfileId: string
  quantity: number
  snapMaterialCost: number
  snapInkCost: number
  snapOverheadCost: number
  snapSpoilageRate: number
  snapSellingPrice: number
  overridePrice: number | null
  createdAt: string
  sortOrder: number
  serviceName: string
  materialName: string
}

export interface QuoteWithLines extends Quote {
  lineItems: QuoteLineItem[]
}

export interface CreateQuoteInput {
  name: string
  notes?: string
  createdBy: string
  lineItems: {
    costProfileId: string
    quantity: number
    snapMaterialCost: number
    snapInkCost: number
    snapOverheadCost: number
    snapSpoilageRate: number
    snapSellingPrice: number
    overridePrice?: number
  }[]
}

export interface MarginThresholds {
  great: number
  good: number
}
