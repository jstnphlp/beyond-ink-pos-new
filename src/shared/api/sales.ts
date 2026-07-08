import { supabase } from './supabase'
import type { SelectedService, DeliveryInfo, Discount, PaymentMethod } from '@/stores/pos-store'
import { MATERIALS, SERVICES, SERVICE_CATEGORIES } from '@/stores/pos-store'

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

let catalogSynced = false

async function ensureCatalogSynced() {
  if (catalogSynced) return

  const categoryRows = SERVICE_CATEGORIES.map((cat) => ({
    id: slugToUuid(cat.id),
    name: cat.name,
    department:
      cat.department === 'Physical'
        ? 'physical_dept'
        : cat.department === 'Design'
          ? 'design_dept'
          : 'dev_dept',
  }))

  const serviceRows = SERVICES.map((svc) => ({
    id: slugToUuid(svc.id),
    name: svc.name,
    category_id: svc.categoryId ? slugToUuid(svc.categoryId) : null,
  }))

  const itemRows = MATERIALS.map((mat) => ({
    id: mat.id,
    name: mat.name,
    unit: mat.unit,
  }))

  const [catRes, svcRes, itemRes] = await Promise.all([
    supabase.from('service_categories').upsert(categoryRows, { onConflict: 'id' }),
    supabase.from('services').upsert(serviceRows, { onConflict: 'id' }),
    supabase.from('inventory_items').upsert(itemRows, { onConflict: 'id' }),
  ])

  if (catRes.error) throw catRes.error
  if (svcRes.error) throw svcRes.error
  if (itemRes.error) throw itemRes.error

  catalogSynced = true
}

interface CompleteSaleParams {
  selectedServices: SelectedService[]
  delivery: DeliveryInfo
  discount: Discount
  paymentMethod: PaymentMethod
  cashReceived: number
  gcashRef: string
  subtotal: number
  discountAmount: number
  total: number
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
  } = params

  await ensureCatalogSynced()

  const changeDue =
    paymentMethod === 'cash' ? Math.max(0, cashReceived - total) : 0

  const services = selectedServices.map((ss, i) => {
    const material = ss.materialId
      ? MATERIALS.find((m) => m.id === ss.materialId)
      : null
    return {
      serviceId: slugToUuid(ss.service.id),
      serviceName: ss.service.name,
      quantity: ss.quantity,
      sortOrder: i,
      material: material
        ? { id: material.id, name: material.name, pricePerUnit: material.pricePerUnit }
        : null,
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
  })

  if (error) throw error
  return data
}
