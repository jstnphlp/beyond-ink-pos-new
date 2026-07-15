import { supabase } from './supabase'

export async function fetchAllTransactions() {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('id, transaction_number, customer_name, final_total, payment_method, status, completed_at, created_at, cashier_name, department')
    .not('status', 'eq', 'draft')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    'Transaction #': String(row.transaction_number),
    'Customer': row.customer_name ?? 'Walk-in',
    'Department': row.department,
    'Amount (₱)': Number(row.final_total),
    'Payment Method': row.payment_method ?? '—',
    'Status': row.status,
    'Cashier': row.cashier_name,
    'Date': row.created_at ? new Date(row.created_at).toLocaleString() : '—',
  }))
}

export async function fetchAllWalletEntries() {
  const { data, error } = await supabase
    .from('wallet_entries')
    .select('id, type, amount, description, payment_method, entry_date, created_at, wallet_categories(name)')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const rawCat = row.wallet_categories as unknown
    const catName = Array.isArray(rawCat)
      ? (rawCat[0]?.name ?? null)
      : ((rawCat as { name: string } | null)?.name ?? null)

    return {
      'Date': row.entry_date,
      'Type': row.type === 'income' ? 'Income' : 'Expense',
      'Category': catName ?? '—',
      'Description': row.description,
      'Payment Method': row.payment_method === 'cash' ? 'Cash' : 'GCash',
      'Amount (₱)': Number(row.amount),
      'Created At': row.created_at ? new Date(row.created_at).toLocaleString() : '—',
    }
  })
}

export async function fetchAllActivityLogs() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id, action, performed_by, payment_method, amount, description, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  const ACTION_LABELS: Record<string, string> = {
    balance_override_set: 'Override Set',
    balance_override_cleared: 'Override Cleared',
    expense_added: 'Expense Added',
    income_added: 'Income Added',
    entry_deleted: 'Entry Deleted',
  }

  return (data ?? []).map((row) => ({
    'Action': ACTION_LABELS[row.action] ?? row.action,
    'Performed By': row.performed_by,
    'Payment Method': row.payment_method ? (row.payment_method === 'cash' ? 'Cash' : 'GCash') : '—',
    'Amount (₱)': row.amount != null ? Number(row.amount) : '—',
    'Description': row.description ?? '—',
    'Date': row.created_at ? new Date(row.created_at).toLocaleString() : '—',
  }))
}

export async function fetchAllAttendance() {
  const { data, error } = await supabase
    .from('staff_sessions')
    .select('id, staff_name, department, time_in, time_out, auto_logged_out, note, created_at')
    .not('time_out', 'is', null)
    .order('time_in', { ascending: false })

  if (error) throw error

  const DEPT_LABELS: Record<string, string> = {
    physical_dept: 'Physical Print Shop',
    design_dept: 'Design Studio',
    dev_dept: 'Dev Operations',
  }

  return (data ?? []).map((row) => {
    const timeIn = new Date(row.time_in)
    const timeOut = row.time_out ? new Date(row.time_out) : null
    const durationMs = timeOut ? timeOut.getTime() - timeIn.getTime() : null
    const durationHrs = durationMs != null ? (durationMs / 3_600_000).toFixed(2) : '—'

    return {
      'Staff Name': row.staff_name,
      'Department': DEPT_LABELS[row.department] ?? row.department,
      'Time In': timeIn.toLocaleString(),
      'Time Out': timeOut ? timeOut.toLocaleString() : '—',
      'Duration (hrs)': durationHrs,
      'Auto Logged Out': row.auto_logged_out ? 'Yes' : 'No',
      'Note': row.note ?? '—',
    }
  })
}
