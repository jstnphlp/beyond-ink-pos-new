import { supabase } from './supabase'
import type { DraftPayload, DraftRecord } from './drafts.types'
import type { SelectedService, DeliveryInfo, Discount } from '@/stores/pos-store'

interface SaveDraftParams {
  name?: string
  selectedServices: SelectedService[]
  delivery: DeliveryInfo
  discount: Discount
  currentStep: number
  subtotal: number
  total: number
  cashierName?: string
  department?: string
}

export async function saveDraft(params: SaveDraftParams): Promise<string> {
  const {
    name,
    selectedServices,
    delivery,
    discount,
    currentStep,
    subtotal,
    total,
    cashierName = 'Staff',
    department = 'physical_dept',
  } = params

  const payload: DraftPayload = {
    name: name || undefined,
    currentStep,
    selectedServices,
    delivery,
    discount,
    cashierName,
    department,
    savedAt: new Date().toISOString(),
  }

  const transactionNumber = (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString()

  const { data, error } = await supabase
    .from('sales_transactions')
    .insert({
      transaction_number: transactionNumber,
      status: 'draft',
      cashier_name: cashierName,
      department,
      delivery_enabled: delivery.enabled,
      customer_name: delivery.customerName || null,
      delivery_address: delivery.address || null,
      delivery_fee: delivery.enabled ? delivery.fee : 0,
      discount_type: discount.value > 0 ? (discount.type === 'amount' ? 'fixed' : 'percentage') : null,
      discount_value: discount.value > 0 ? discount.value : null,
      draft_payload: payload,
      subtotal,
      final_total: total,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function updateDraft(id: string, params: SaveDraftParams): Promise<void> {
  const {
    name,
    selectedServices,
    delivery,
    discount,
    currentStep,
    subtotal,
    total,
    cashierName = 'Staff',
    department = 'physical_dept',
  } = params

  const payload: DraftPayload = {
    name: name || undefined,
    currentStep,
    selectedServices,
    delivery,
    discount,
    cashierName,
    department,
    savedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('sales_transactions')
    .update({
      delivery_enabled: delivery.enabled,
      customer_name: delivery.customerName || null,
      delivery_address: delivery.address || null,
      delivery_fee: delivery.enabled ? delivery.fee : 0,
      discount_type: discount.value > 0 ? (discount.type === 'amount' ? 'fixed' : 'percentage') : null,
      discount_value: discount.value > 0 ? discount.value : null,
      draft_payload: payload,
      subtotal,
      final_total: total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'draft')

  if (error) throw error
}

export async function getDrafts(): Promise<DraftRecord[]> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('id, transaction_number, cashier_name, department, draft_payload, subtotal, final_total, created_at, updated_at')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    transactionNumber: String(row.transaction_number),
    cashierName: row.cashier_name,
    department: row.department,
    draftPayload: row.draft_payload as DraftPayload,
    subtotal: Number(row.subtotal),
    finalTotal: Number(row.final_total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getDraft(id: string): Promise<DraftRecord | null> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('id, transaction_number, cashier_name, department, draft_payload, subtotal, final_total, created_at, updated_at')
    .eq('id', id)
    .eq('status', 'draft')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    id: data.id,
    transactionNumber: String(data.transaction_number),
    cashierName: data.cashier_name,
    department: data.department,
    draftPayload: data.draft_payload as DraftPayload,
    subtotal: Number(data.subtotal),
    finalTotal: Number(data.final_total),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase
    .from('sales_transactions')
    .delete()
    .eq('id', id)
    .eq('status', 'draft')

  if (error) throw error
}
