import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const {
      services,
      delivery,
      discount,
      paymentMethod,
      cashReceived,
      subtotal,
      total,
      catalog,
    } = body

    // Upsert catalog data if provided (first run only)
    if (catalog) {
      const { categories, items, serviceList } = catalog

      await Promise.all([
        supabase.from('service_categories').upsert(
          categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            department: c.department,
          })),
          { onConflict: 'id' },
        ),
        supabase.from('inventory_items').upsert(
          items.map((i: any) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
          })),
          { onConflict: 'id' },
        ),
      ])

      await supabase.from('services').upsert(
        serviceList.map((s: any) => ({
          id: s.id,
          name: s.name,
          category_id: s.categoryId,
        })),
        { onConflict: 'id' },
      )
    }

    // Insert transaction
    const now = new Date().toISOString()
    const transactionNumber = Date.now() * 1000 + Math.floor(Math.random() * 1000)
    const changeDue =
      paymentMethod === 'cash' ? Math.max(0, cashReceived - total) : 0

    const { data: txn, error: txnError } = await supabase
      .from('sales_transactions')
      .insert({
        transaction_number: transactionNumber,
        status: 'completed',
        cashier_name: 'Juan Carlos',
        delivery_enabled: delivery.enabled,
        customer_name: delivery.customerName || null,
        delivery_address: delivery.address || null,
        delivery_fee: delivery.enabled ? delivery.fee : 0,
        discount_type:
          discount.value > 0
            ? discount.type === 'amount'
              ? 'fixed'
              : 'percentage'
            : null,
        discount_value: discount.value > 0 ? discount.value : null,
        subtotal,
        final_total: total,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? cashReceived : null,
        gcash_amount_paid: paymentMethod === 'gcash' ? total : null,
        change_due: paymentMethod === 'cash' ? changeDue : null,
        completed_at: now,
        updated_at: now,
        department: 'physical_dept',
      })
      .select('id')
      .single()

    if (txnError) throw txnError

    // Batch insert service lines
    const lineRows = services.map((s: any, i: number) => ({
      transaction_id: txn.id,
      service_id: s.serviceId,
      service_name: s.serviceName,
      sort_order: i,
    }))

    const { data: lines, error: linesError } = await supabase
      .from('sales_service_lines')
      .insert(lineRows)
      .select('id')

    if (linesError) throw linesError

    // Batch insert material entries
    const materialRows = services
      .map((s: any, i: number) => {
        if (!s.material) return null
        return {
          service_line_id: lines![i].id,
          inventory_item_id: s.material.id,
          material_name: s.material.name,
          quantity: s.quantity,
          unit_price: s.material.pricePerUnit,
        }
      })
      .filter(Boolean)

    if (materialRows.length > 0) {
      const { error: matError } = await supabase
        .from('sales_material_entries')
        .insert(materialRows)
      if (matError) throw matError
    }

    return new Response(
      JSON.stringify({ success: true, transactionId: txn.id }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('complete-sale error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
