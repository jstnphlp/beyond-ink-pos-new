import { supabase } from './supabase'
import type {
  CostProfile,
  CostProfileInput,
  Quote,
  QuoteLineItem,
  QuoteWithLines,
  CreateQuoteInput,
  MarginThresholds,
} from './costing.types'

export async function getCostProfiles(): Promise<CostProfile[]> {
  const [profilesRes, linksRes] = await Promise.all([
    supabase
      .from('cost_profiles')
      .select(
        `
        id, service_id, inventory_item_id, material_cost, ink_cost,
        spoilage_rate, is_active, created_at, updated_at,
        services!inner(name, base_price),
        inventory_items!inner(name, selling_price)
      `
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('service_material_prices')
      .select('service_id, inventory_item_id, suggested_unit_price'),
  ])

  if (profilesRes.error) throw profilesRes.error
  if (linksRes.error) throw linksRes.error

  const priceMap = new Map<string, number>()
  for (const link of linksRes.data ?? []) {
    const key = `${link.service_id}:${link.inventory_item_id}`
    priceMap.set(key, Number(link.suggested_unit_price ?? 0))
  }

  return (profilesRes.data ?? []).map((row) => {
    const svc = row.services as unknown as { name: string; base_price: number }
    const mat = row.inventory_items as unknown as {
      name: string
      selling_price: number
    }
    const priceKey = `${row.service_id}:${row.inventory_item_id}`
    const linkedPrice = priceMap.get(priceKey)
    return {
      id: row.id as string,
      serviceId: row.service_id as string,
      inventoryItemId: row.inventory_item_id as string,
      materialCost: Number(row.material_cost ?? 0),
      inkCost: Number(row.ink_cost ?? 0),
      spoilageRate: Number(row.spoilage_rate ?? 0),
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      serviceName: svc?.name ?? '',
      materialName: mat?.name ?? '',
      sellingPrice: linkedPrice ?? Number(svc?.base_price ?? 0),
    }
  })
}

export async function upsertCostProfile(data: CostProfileInput) {
  const { error } = await supabase.from('cost_profiles').upsert(
    {
      service_id: data.serviceId,
      inventory_item_id: data.inventoryItemId,
      material_cost: data.materialCost,
      ink_cost: data.inkCost,
      spoilage_rate: data.spoilageRate,
    },
    { onConflict: 'service_id,inventory_item_id' }
  )
  if (error) throw error
}

export async function deleteCostProfile(id: string) {
  const { error } = await supabase
    .from('cost_profiles')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('id, name, notes, created_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  const quotes = data ?? []
  if (quotes.length === 0) return []

  const ids = quotes.map((q) => q.id)
  const { data: counts, error: countError } = await supabase
    .from('quote_line_items')
    .select('quote_id')
    .in('quote_id', ids)

  if (countError) throw countError

  const countMap = new Map<string, number>()
  for (const row of counts ?? []) {
    countMap.set(row.quote_id, (countMap.get(row.quote_id) ?? 0) + 1)
  }

  return quotes.map((q) => ({
    id: q.id as string,
    name: q.name as string,
    notes: (q.notes as string) ?? null,
    createdBy: q.created_by as string,
    createdAt: q.created_at as string,
    updatedAt: q.updated_at as string,
    lineItemCount: countMap.get(q.id) ?? 0,
  }))
}

export async function getQuote(id: string): Promise<QuoteWithLines | null> {
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, name, notes, created_by, created_at, updated_at')
    .eq('id', id)
    .single()

  if (quoteError) throw quoteError
  if (!quote) return null

  const { data: lines, error: linesError } = await supabase
    .from('quote_line_items')
    .select(
      `
      id, quote_id, cost_profile_id, quantity,
      snap_material_cost, snap_ink_cost, snap_overhead_cost,
      snap_spoilage_rate, snap_selling_price, override_price,
      created_at, sort_order,
      cost_profiles!inner(
        service_id, inventory_item_id,
        services(name),
        inventory_items(name)
      )
    `
    )
    .eq('quote_id', id)
    .order('sort_order')

  if (linesError) throw linesError

  const lineItems: QuoteLineItem[] = (lines ?? []).map((row) => {
    const cp = row.cost_profiles as unknown as {
      service_id: string
      inventory_item_id: string
      services: { name: string }
      inventory_items: { name: string }
    }
    return {
      id: row.id as string,
      quoteId: row.quote_id as string,
      costProfileId: row.cost_profile_id as string,
      quantity: Number(row.quantity ?? 1),
      snapMaterialCost: Number(row.snap_material_cost ?? 0),
      snapInkCost: Number(row.snap_ink_cost ?? 0),
      snapOverheadCost: Number(row.snap_overhead_cost ?? 0),
      snapSpoilageRate: Number(row.snap_spoilage_rate ?? 0),
      snapSellingPrice: Number(row.snap_selling_price ?? 0),
      overridePrice:
        row.override_price != null ? Number(row.override_price) : null,
      createdAt: row.created_at as string,
      sortOrder: Number(row.sort_order ?? 0),
      serviceName: cp?.services?.name ?? '',
      materialName: cp?.inventory_items?.name ?? '',
    }
  })

  return {
    id: quote.id as string,
    name: quote.name as string,
    notes: (quote.notes as string) ?? null,
    createdBy: quote.created_by as string,
    createdAt: quote.created_at as string,
    updatedAt: quote.updated_at as string,
    lineItemCount: lineItems.length,
    lineItems,
  }
}

export async function createQuote(data: CreateQuoteInput): Promise<string> {
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      name: data.name,
      notes: data.notes ?? null,
      created_by: data.createdBy,
    })
    .select('id')
    .single()

  if (quoteError) throw quoteError
  const quoteId = quote.id as string

  if (data.lineItems.length > 0) {
    const rows = data.lineItems.map((li, i) => ({
      quote_id: quoteId,
      cost_profile_id: li.costProfileId,
      quantity: li.quantity,
      snap_material_cost: li.snapMaterialCost,
      snap_ink_cost: li.snapInkCost,
      snap_overhead_cost: li.snapOverheadCost,
      snap_spoilage_rate: li.snapSpoilageRate,
      snap_selling_price: li.snapSellingPrice,
      override_price: li.overridePrice ?? null,
      sort_order: i,
    }))

    const { error: linesError } = await supabase
      .from('quote_line_items')
      .insert(rows)

    if (linesError) throw linesError
  }

  return quoteId
}

export async function updateQuote(
  id: string,
  data: Partial<{ name: string; notes: string }>
) {
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.notes !== undefined) update.notes = data.notes

  const { error } = await supabase.from('quotes').update(update).eq('id', id)
  if (error) throw error
}

export async function replaceQuote(id: string, data: CreateQuoteInput) {
  const { error: metaError } = await supabase
    .from('quotes')
    .update({ name: data.name, notes: data.notes ?? null })
    .eq('id', id)
  if (metaError) throw metaError

  const { error: delError } = await supabase
    .from('quote_line_items')
    .delete()
    .eq('quote_id', id)
  if (delError) throw delError

  if (data.lineItems.length > 0) {
    const rows = data.lineItems.map((li, i) => ({
      quote_id: id,
      cost_profile_id: li.costProfileId,
      quantity: li.quantity,
      snap_material_cost: li.snapMaterialCost,
      snap_ink_cost: li.snapInkCost,
      snap_overhead_cost: li.snapOverheadCost,
      snap_spoilage_rate: li.snapSpoilageRate,
      snap_selling_price: li.snapSellingPrice,
      override_price: li.overridePrice ?? null,
      sort_order: i,
    }))

    const { error: linesError } = await supabase
      .from('quote_line_items')
      .insert(rows)
    if (linesError) throw linesError
  }
}

export async function deleteQuote(id: string) {
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) throw error
}

export async function getMarginThresholds(): Promise<MarginThresholds> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'margin_thresholds')
    .single()

  if (error || !data) {
    return { great: 60, good: 40 }
  }

  const val = data.value as Record<string, unknown>
  return {
    great: Number(val.great ?? 60),
    good: Number(val.good ?? 40),
  }
}

export async function updateMarginThresholds(data: MarginThresholds) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'margin_thresholds', value: data }, { onConflict: 'key' })
  if (error) throw error
}

export async function importCostProfiles(rows: CostProfileInput[]) {
  if (rows.length === 0) return

  const payload = rows.map((r) => ({
    service_id: r.serviceId,
    inventory_item_id: r.inventoryItemId,
    material_cost: r.materialCost,
    ink_cost: r.inkCost,
    spoilage_rate: r.spoilageRate,
  }))

  const { error } = await supabase
    .from('cost_profiles')
    .upsert(payload, { onConflict: 'service_id,inventory_item_id' })
  if (error) throw error
}
