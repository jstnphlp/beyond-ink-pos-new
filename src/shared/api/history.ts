import { supabase } from './supabase'
import type {
  HistoryTransaction,
  HistoryPageResult,
  HistoryFilters,
  TransactionDetail,
} from './history.types'

const PAGE_SIZE = 20

interface FetchPageParams {
  cursor?: { createdAt: string; id: string } | null
  filters: HistoryFilters
}

export async function fetchHistoryPage({
  cursor,
  filters,
}: FetchPageParams): Promise<HistoryPageResult> {
  const { search, status, paymentMethod, dateFrom, dateTo } = filters

  let query = supabase
    .from('sales_transactions')
    .select(
      'id, transaction_number, customer_name, final_total, payment_method, status, completed_at, created_at, cashier_name, department'
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  // Search filter
  if (search.trim()) {
    const escaped = search.replace(/%/g, '\\%').replace(/,/g, '')
    const q = `%${escaped}%`
    query = query.or(
      `customer_name.ilike.${q},transaction_number.cast.text.ilike.${q}`
    )
  }

  // Status filter
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Payment method filter
  if (paymentMethod !== 'all') {
    query = query.eq('payment_method', paymentMethod)
  }

  // Date range filters
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
  }

  // Cursor-based pagination
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    )
  }

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const hasMore = rows.length > PAGE_SIZE
  const page = rows.slice(0, PAGE_SIZE)

  const transactions: HistoryTransaction[] = page.map((row) => ({
    id: row.id,
    transactionNumber: String(row.transaction_number),
    customerName: row.customer_name,
    finalTotal: Number(row.final_total),
    paymentMethod: row.payment_method as 'cash' | 'gcash' | null,
    status: row.status as 'completed' | 'cancelled',
    completedAt: row.completed_at,
    createdAt: row.created_at,
    cashierName: row.cashier_name,
    department: row.department,
  }))

  const lastRow = page[page.length - 1]
  const nextCursor = hasMore && lastRow
    ? { createdAt: lastRow.created_at, id: lastRow.id }
    : null

  return { transactions, nextCursor }
}

export async function fetchTransactionDetail(
  id: string
): Promise<TransactionDetail> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select(
      `id, transaction_number, status, cashier_name, department,
       customer_name, delivery_address, delivery_fee,
       discount_type, discount_value, subtotal, final_total,
       payment_method, cash_received, gcash_amount_paid, change_due,
       completed_at, created_at,
       sales_service_lines (
         id, service_name, sort_order,
         sales_material_entries (
           quantity, unit_price, material_name
         )
       )`
    )
    .eq('id', id)
    .single()

  if (error) throw error

  const serviceLines = (data.sales_service_lines ?? [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .flatMap((line: { id: string; service_name: string; sales_material_entries: Array<{ quantity: number; unit_price: number; material_name: string | null }> }) =>
      (line.sales_material_entries ?? []).map((entry) => ({
        id: line.id,
        serviceName: line.service_name,
        quantity: Number(entry.quantity),
        unitPrice: Number(entry.unit_price),
        materialName: entry.material_name,
      }))
    )

  return {
    id: data.id,
    transactionNumber: String(data.transaction_number),
    status: data.status as 'completed' | 'cancelled',
    cashierName: data.cashier_name,
    department: data.department,
    customerName: data.customer_name,
    deliveryAddress: data.delivery_address,
    deliveryFee: Number(data.delivery_fee),
    discountType: data.discount_type as 'fixed' | 'percentage' | null,
    discountValue: data.discount_value != null ? Number(data.discount_value) : null,
    subtotal: Number(data.subtotal),
    finalTotal: Number(data.final_total),
    paymentMethod: data.payment_method as 'cash' | 'gcash' | null,
    cashReceived: data.cash_received != null ? Number(data.cash_received) : null,
    gcashAmountPaid: data.gcash_amount_paid != null ? Number(data.gcash_amount_paid) : null,
    changeDue: data.change_due != null ? Number(data.change_due) : null,
    completedAt: data.completed_at,
    createdAt: data.created_at,
    serviceLines,
  }
}
