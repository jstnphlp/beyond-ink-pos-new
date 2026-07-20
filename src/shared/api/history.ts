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
  const { data: txn, error: txnError } = await supabase
    .from('sales_transactions')
    .select(
      `id, transaction_number, status, cashier_name, department,
       customer_name, delivery_address, delivery_fee,
       discount_type, discount_value, subtotal, final_total,
       payment_method, cash_received, gcash_amount_paid, change_due,
       completed_at, created_at`
    )
    .eq('id', id)
    .single()

  if (txnError) throw txnError

  const { data: lines, error: linesError } = await supabase
    .from('sales_service_lines')
    .select('id, service_name, sort_order, quantity, unit_price')
    .eq('transaction_id', id)
    .order('sort_order', { ascending: true })

  if (linesError) throw linesError

  const lineIds = (lines ?? []).map((l) => l.id)

  let entries: Array<{
    service_line_id: string
    quantity: number
    unit_price: number
    material_name: string | null
  }> = []

  if (lineIds.length > 0) {
    const { data: entryRows, error: entriesError } = await supabase
      .from('sales_material_entries')
      .select('service_line_id, quantity, unit_price, material_name')
      .in('service_line_id', lineIds)

    if (entriesError) throw entriesError
    entries = entryRows ?? []
  }

  const entriesByLine = new Map<string, typeof entries>()
  for (const entry of entries) {
    const arr = entriesByLine.get(entry.service_line_id) ?? []
    arr.push(entry)
    entriesByLine.set(entry.service_line_id, arr)
  }

  const serviceLines = (lines ?? []).map((line) => {
    const lineEntries = entriesByLine.get(line.id) ?? []
    const entryQty = lineEntries.length > 0 ? Number(lineEntries[0].quantity) : 1
    const lineQty = Number(line.quantity)
    const linePrice = Number(line.unit_price)
    return {
      id: line.id,
      serviceName: line.service_name,
      quantity: lineQty > 1 ? lineQty : entryQty,
      unitPrice: linePrice,
      materials: lineEntries.map((entry) => ({
        materialName: entry.material_name ?? '',
        quantity: Number(entry.quantity),
        unitPrice: Number(entry.unit_price),
      })),
    }
  })

  return {
    id: txn.id,
    transactionNumber: String(txn.transaction_number),
    status: txn.status as 'completed' | 'cancelled',
    cashierName: txn.cashier_name,
    department: txn.department,
    customerName: txn.customer_name,
    deliveryAddress: txn.delivery_address,
    deliveryFee: Number(txn.delivery_fee),
    discountType: txn.discount_type as 'fixed' | 'percentage' | null,
    discountValue: txn.discount_value != null ? Number(txn.discount_value) : null,
    subtotal: Number(txn.subtotal),
    finalTotal: Number(txn.final_total),
    paymentMethod: txn.payment_method as 'cash' | 'gcash' | null,
    cashReceived: txn.cash_received != null ? Number(txn.cash_received) : null,
    gcashAmountPaid: txn.gcash_amount_paid != null ? Number(txn.gcash_amount_paid) : null,
    changeDue: txn.change_due != null ? Number(txn.change_due) : null,
    completedAt: txn.completed_at,
    createdAt: txn.created_at,
    serviceLines,
  }
}
