export type HistoryStatus = 'completed' | 'cancelled'

export interface HistoryTransaction {
  id: string
  transactionNumber: string
  customerName: string | null
  finalTotal: number
  paymentMethod: 'cash' | 'gcash' | null
  status: HistoryStatus
  completedAt: string | null
  createdAt: string
  cashierName: string
  department: string
}

export interface HistoryPageResult {
  transactions: HistoryTransaction[]
  nextCursor: { createdAt: string; id: string } | null
}

export interface HistoryFilters {
  search: string
  status: HistoryStatus | 'all'
  paymentMethod: 'all' | 'cash' | 'gcash'
  dateFrom: string | null
  dateTo: string | null
}

export interface TransactionServiceLine {
  id: string
  serviceName: string
  quantity: number
  unitPrice: number
  materialName: string | null
}

export interface TransactionDetail {
  id: string
  transactionNumber: string
  status: HistoryStatus
  cashierName: string
  department: string
  customerName: string | null
  deliveryAddress: string | null
  deliveryFee: number
  discountType: 'fixed' | 'percentage' | null
  discountValue: number | null
  subtotal: number
  finalTotal: number
  paymentMethod: 'cash' | 'gcash' | null
  cashReceived: number | null
  gcashAmountPaid: number | null
  changeDue: number | null
  completedAt: string | null
  createdAt: string
  serviceLines: TransactionServiceLine[]
}
