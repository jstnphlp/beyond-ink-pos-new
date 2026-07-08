import { supabase } from './supabase'

export interface DepartmentSummary {
  department: string
  label: string
  activeTransactions: number
  dailyRevenue: number
  icon: string
}

export interface DashboardTransaction {
  id: string
  transactionNumber: string
  customer: string
  department: string
  amount: number
  status: 'completed' | 'pending' | 'refunded'
  timestamp: string
  cashier: string
}

const DEPT_LABELS: Record<string, { label: string; icon: string }> = {
  physical_dept: { label: 'Physical Print Shop', icon: 'Printer' },
  design_dept: { label: 'Design Studio', icon: 'Palette' },
  dev_dept: { label: 'Dev Operations', icon: 'Code2' },
}

export async function getDepartmentSummaries(): Promise<DepartmentSummary[]> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('sales_transactions')
    .select('department, final_total, status')
    .in('department', ['physical_dept', 'design_dept', 'dev_dept'])
    .gte('created_at', todayStart.toISOString())

  if (error) throw error

  const deptMap: Record<string, { revenue: number; active: number }> = {
    physical_dept: { revenue: 0, active: 0 },
    design_dept: { revenue: 0, active: 0 },
    dev_dept: { revenue: 0, active: 0 },
  }

  for (const row of data ?? []) {
    const dept = row.department as string
    if (!deptMap[dept]) continue
    if (row.status === 'completed') {
      deptMap[dept].revenue += Number(row.final_total)
    }
    if (row.status === 'pending' || row.status === 'draft') {
      deptMap[dept].active += 1
    }
  }

  return Object.entries(deptMap).map(([dept, { revenue, active }]) => {
    const meta = DEPT_LABELS[dept] ?? { label: dept, icon: 'Printer' }
    return {
      department: dept,
      label: meta.label,
      activeTransactions: active,
      dailyRevenue: revenue,
      icon: meta.icon,
    }
  })
}

export async function getRecentTransactions(): Promise<DashboardTransaction[]> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('id, transaction_number, customer_name, department, final_total, status, created_at, cashier_name')
    .not('status', 'eq', 'draft')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    transactionNumber: String(row.transaction_number),
    customer: row.customer_name ?? 'Walk-in',
    department: row.department,
    amount: Number(row.final_total),
    status: row.status as 'completed' | 'pending' | 'refunded',
    timestamp: row.created_at,
    cashier: row.cashier_name,
  }))
}
