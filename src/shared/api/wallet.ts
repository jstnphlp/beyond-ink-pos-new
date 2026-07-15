import { supabase } from './supabase'

export interface WalletSummary {
  cashTotal: number
  gcashTotal: number
  combinedTotal: number
  transactionCount: number
  cashEntriesNet: number
  gcashEntriesNet: number
  cashOverride: number | null
  gcashOverride: number | null
  cashSalesTotal: number
  gcashSalesTotal: number
  cashSalesAfterOverride: number
  gcashSalesAfterOverride: number
}

export interface WalletTransaction {
  id: string
  transactionNumber: string
  finalTotal: number
  paymentMethod: 'cash' | 'gcash'
  completedAt: string
  customerName: string | null
}

export interface WalletCategory {
  id: string
  name: string
  isDefault: boolean
}

export interface WalletEntry {
  id: string
  type: 'expense' | 'income'
  amount: number
  description: string
  categoryId: string | null
  categoryName: string | null
  paymentMethod: 'cash' | 'gcash'
  entryDate: string
  createdAt: string
}

export interface CreateWalletEntryInput {
  type: 'expense' | 'income'
  amount: number
  description: string
  categoryId?: string | null
  paymentMethod: 'cash' | 'gcash'
  entryDate?: string
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export async function fetchWalletSummary(): Promise<WalletSummary> {
  const [salesResult, entriesResult, overridesResult] = await Promise.all([
    supabase
      .from('sales_transactions')
      .select('final_total, payment_method, completed_at')
      .eq('status', 'completed'),
    supabase
      .from('wallet_entries')
      .select('type, amount, payment_method'),
    supabase
      .from('wallet_balance_overrides')
      .select('payment_method, amount, updated_at'),
  ])

  if (salesResult.error) throw salesResult.error
  if (entriesResult.error) throw entriesResult.error
  if (overridesResult.error) throw overridesResult.error

  const overrides = new Map<string, { amount: number; updatedAt: string }>()
  for (const row of overridesResult.data ?? []) {
    overrides.set(row.payment_method, { amount: Number(row.amount), updatedAt: row.updated_at })
  }

  const cashOverrideData = overrides.get('cash')
  const gcashOverrideData = overrides.get('gcash')
  const cashOverride = cashOverrideData?.amount ?? null
  const gcashOverride = gcashOverrideData?.amount ?? null

  let cashSalesTotal = 0
  let gcashSalesTotal = 0
  let cashSalesAfterOverride = 0
  let gcashSalesAfterOverride = 0

  for (const row of salesResult.data ?? []) {
    const amount = Number(row.final_total)
    if (row.payment_method === 'cash') {
      cashSalesTotal += amount
      if (cashOverrideData && row.completed_at > cashOverrideData.updatedAt) {
        cashSalesAfterOverride += amount
      }
    } else if (row.payment_method === 'gcash') {
      gcashSalesTotal += amount
      if (gcashOverrideData && row.completed_at > gcashOverrideData.updatedAt) {
        gcashSalesAfterOverride += amount
      }
    }
  }

  let cashEntriesNet = 0
  let gcashEntriesNet = 0

  for (const row of entriesResult.data ?? []) {
    const amount = Number(row.amount)
    const sign = row.type === 'income' ? 1 : -1
    if (row.payment_method === 'cash') cashEntriesNet += amount * sign
    else if (row.payment_method === 'gcash') gcashEntriesNet += amount * sign
  }

  const cashTotal = cashOverride !== null
    ? cashOverride + cashSalesAfterOverride
    : cashSalesTotal + cashEntriesNet
  const gcashTotal = gcashOverride !== null
    ? gcashOverride + gcashSalesAfterOverride
    : gcashSalesTotal + gcashEntriesNet

  return {
    cashTotal,
    gcashTotal,
    combinedTotal: cashTotal + gcashTotal,
    transactionCount: (salesResult.data ?? []).length,
    cashEntriesNet,
    gcashEntriesNet,
    cashOverride,
    gcashOverride,
    cashSalesTotal,
    gcashSalesTotal,
    cashSalesAfterOverride,
    gcashSalesAfterOverride,
  }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('id, transaction_number, final_total, payment_method, completed_at, customer_name')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(10)

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

// ─── Categories ───────────────────────────────────────────────────────────────

export async function fetchWalletCategories(): Promise<WalletCategory[]> {
  const { data, error } = await supabase
    .from('wallet_categories')
    .select('id, name, is_default')
    .order('is_default', { ascending: false })
    .order('name')

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
  }))
}

export async function createWalletCategory(name: string): Promise<WalletCategory> {
  const { data, error } = await supabase
    .from('wallet_categories')
    .insert({ name })
    .select('id, name, is_default')
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    isDefault: data.is_default,
  }
}

// ─── Entries ──────────────────────────────────────────────────────────────────

export async function fetchWalletEntries(
  paymentMethod?: 'cash' | 'gcash'
): Promise<WalletEntry[]> {
  let query = supabase
    .from('wallet_entries')
    .select('id, type, amount, description, category_id, payment_method, entry_date, created_at, wallet_categories(name)')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (paymentMethod) {
    query = query.eq('payment_method', paymentMethod)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((row) => {
    const rawCat = row.wallet_categories as unknown
    const catName = Array.isArray(rawCat)
      ? (rawCat[0]?.name ?? null)
      : ((rawCat as { name: string } | null)?.name ?? null)

    return {
      id: row.id,
      type: row.type as 'expense' | 'income',
      amount: Number(row.amount),
      description: row.description,
      categoryId: row.category_id,
      categoryName: catName,
      paymentMethod: row.payment_method as 'cash' | 'gcash',
      entryDate: row.entry_date,
      createdAt: row.created_at,
    }
  })
}

export async function createWalletEntry(entry: CreateWalletEntryInput): Promise<WalletEntry> {
  const { data, error } = await supabase
    .from('wallet_entries')
    .insert({
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      category_id: entry.categoryId ?? null,
      payment_method: entry.paymentMethod,
      entry_date: entry.entryDate ?? new Date().toISOString().slice(0, 10),
    })
    .select('id, type, amount, description, category_id, payment_method, entry_date, created_at')
    .single()

  if (error) throw error

  return {
    id: data.id,
    type: data.type as 'expense' | 'income',
    amount: Number(data.amount),
    description: data.description,
    categoryId: data.category_id,
    categoryName: null,
    paymentMethod: data.payment_method as 'cash' | 'gcash',
    entryDate: data.entry_date,
    createdAt: data.created_at,
  }
}

export async function deleteWalletEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('wallet_entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Balance Overrides ────────────────────────────────────────────────────────

export async function setWalletBalanceOverride(
  paymentMethod: 'cash' | 'gcash',
  amount: number
): Promise<void> {
  const { error } = await supabase
    .from('wallet_balance_overrides')
    .upsert(
      { payment_method: paymentMethod, amount, updated_at: new Date().toISOString() },
      { onConflict: 'payment_method' }
    )

  if (error) throw error
}

export async function clearWalletBalanceOverride(
  paymentMethod: 'cash' | 'gcash'
): Promise<void> {
  const { error } = await supabase
    .from('wallet_balance_overrides')
    .delete()
    .eq('payment_method', paymentMethod)

  if (error) throw error
}
