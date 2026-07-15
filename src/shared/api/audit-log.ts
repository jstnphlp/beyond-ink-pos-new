import { supabase } from './supabase'

export type ActivityAction =
  | 'balance_override_set'
  | 'balance_override_cleared'
  | 'expense_added'
  | 'income_added'
  | 'entry_deleted'

export interface ActivityLogEntry {
  id: string
  action: ActivityAction
  performedBy: string
  paymentMethod: 'cash' | 'gcash' | null
  amount: number | null
  description: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface LogActivityInput {
  action: ActivityAction
  performedBy: string
  paymentMethod?: 'cash' | 'gcash'
  amount?: number
  description?: string
  metadata?: Record<string, unknown>
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      action: input.action,
      performed_by: input.performedBy,
      payment_method: input.paymentMethod ?? null,
      amount: input.amount ?? null,
      description: input.description ?? null,
      metadata: input.metadata ?? null,
    })

  if (error) throw error
}

export async function fetchActivityLogs(limit = 10, offset = 0): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id, action, performed_by, payment_method, amount, description, metadata, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action as ActivityAction,
    performedBy: row.performed_by,
    paymentMethod: row.payment_method as 'cash' | 'gcash' | null,
    amount: row.amount != null ? Number(row.amount) : null,
    description: row.description,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.created_at,
  }))
}
