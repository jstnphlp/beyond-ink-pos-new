import { supabase } from './supabase'

export interface WalletSummary {
  cashTotal: number
  gcashTotal: number
  combinedTotal: number
  transactionCount: number
}

export interface WalletTransaction {
  id: string
  transactionNumber: string
  finalTotal: number
  paymentMethod: 'cash' | 'gcash'
  completedAt: string
  customerName: string | null
}

export async function fetchWalletSummary(): Promise<WalletSummary> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('final_total, payment_method')
    .eq('status', 'completed')

  if (error) throw error

  let cashTotal = 0
  let gcashTotal = 0

  for (const row of data ?? []) {
    const amount = Number(row.final_total)
    if (row.payment_method === 'cash') cashTotal += amount
    else if (row.payment_method === 'gcash') gcashTotal += amount
  }

  return {
    cashTotal,
    gcashTotal,
    combinedTotal: cashTotal + gcashTotal,
    transactionCount: (data ?? []).length,
  }
}

export async function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('id, transaction_number, final_total, payment_method, completed_at, customer_name')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    transactionNumber: String(row.transaction_number),
    finalTotal: Number(row.final_total),
    paymentMethod: row.payment_method as 'cash' | 'gcash',
    completedAt: row.completed_at,
    customerName: row.customer_name,
  }))
}
