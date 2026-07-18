import { supabase } from './supabase'
import type { SelectedService, DeliveryInfo, Discount, PaymentMethod } from '@/stores/pos-store'
import { resolveMaterials } from '@/stores/pos-store'
import type { StaffMember } from './staff.types'

function slugToUuid(slug: string): string {
  let h1 = 0x811c9dc5
  for (let i = 0; i < slug.length; i++) {
    h1 ^= slug.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193)
  }
  let h2 = 0x01000193
  for (let i = slug.length - 1; i >= 0; i--) {
    h2 ^= slug.charCodeAt(i)
    h2 = Math.imul(h2, 0x811c9dc5)
  }
  const h3 = Math.imul(h1, h2)
  const p = (n: number) => (n >>> 0).toString(16).padStart(8, '0')
  const raw = p(h1) + p(h2) + p(h3) + p(h1 ^ h2)
  return (
    raw.slice(0, 8) + '-' +
    raw.slice(8, 12) + '-' +
    '4' + raw.slice(13, 16) + '-' +
    '8' + raw.slice(17, 20) + '-' +
    raw.slice(20, 32)
  )
}

function resolveId(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id)) return id
  return slugToUuid(id)
}

interface CompleteSaleParams {
  selectedServices: SelectedService[]
  delivery: DeliveryInfo
  discount: Discount
  paymentMethod: PaymentMethod
  cashReceived: number
  subtotal: number
  discountAmount: number
  total: number
  cashierName?: string
  contributors?: StaffMember[]
  catalog?: import('@/shared/api/catalog.types').CatalogData | null
  department?: string
}

export async function completeSale(params: CompleteSaleParams) {
  const {
    selectedServices,
    delivery,
    discount,
    paymentMethod,
    cashReceived,
    subtotal,
    total,
    cashierName = 'Staff',
    contributors = [],
    catalog = null,
    department = 'physical_dept',
  } = params

  const materials = resolveMaterials(catalog)

  const changeDue =
    paymentMethod === 'cash' ? Math.max(0, cashReceived - total) : 0

  const services = selectedServices.map((ss, i) => {
    const unitPrice = ss.customMaterialPrice ?? ss.service.basePrice
    const selectedMats = ss.materialIds
      .map((id) => materials.find((m) => m.id === id))
      .filter(Boolean)
    return {
      serviceId: resolveId(ss.service.id),
      serviceName: ss.service.name,
      quantity: ss.quantity,
      sortOrder: i,
      unitPrice,
      materials: selectedMats.map((mat) => ({
        id: mat!.id,
        name: mat!.name,
        costPerUnit: mat!.costPerUnit,
      })),
    }
  })

  const { data, error } = await supabase.rpc('complete_sale', {
    p_services: services,
    p_delivery_enabled: delivery.enabled,
    p_customer_name: delivery.customerName || null,
    p_delivery_address: delivery.address || null,
    p_delivery_fee: delivery.enabled ? delivery.fee : 0,
    p_discount_type: discount.value > 0 ? (discount.type === 'amount' ? 'fixed' : 'percentage') : null,
    p_discount_value: discount.value > 0 ? discount.value : null,
    p_subtotal: subtotal,
    p_final_total: total,
    p_payment_method: paymentMethod,
    p_cash_received: paymentMethod === 'cash' ? cashReceived : null,
    p_gcash_amount_paid: paymentMethod === 'gcash' ? total : null,
    p_change_due: paymentMethod === 'cash' ? changeDue : null,
    p_cashier_name: cashierName,
    p_department: department,
  })

  if (error) throw error

  if (contributors.length > 0) {
    const transactionId = extractTransactionId(data)
    if (transactionId) {
      const rows = contributors.map((c) => ({
        transaction_id: transactionId,
        staff_member_id: c.id,
        staff_name: c.name,
      }))
      const { error: contribError } = await supabase
        .from('transaction_contributors')
        .insert(rows)
      if (contribError) throw contribError
    }
  }

  return data
}

function extractTransactionId(data: unknown): string | null {
  if (!data) return null
  if (typeof data === 'string') return data
  if (Array.isArray(data) && data.length > 0) {
    const row = data[0]
    if (row && typeof row === 'object' && 'id' in row) return row.id as string
  }
  if (typeof data === 'object' && data !== null && 'id' in (data as Record<string, unknown>)) {
    return (data as Record<string, unknown>).id as string
  }
  return null
}
