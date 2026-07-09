import { supabase } from './supabase'
import type {
  CatalogData,
  CatalogCategory,
  CatalogService,
  CatalogMaterial,
  ServiceMaterialLink,
} from './catalog.types'

function mapCategory(row: Record<string, unknown>): CatalogCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    department: row.department as string,
    icon: (row.icon as string) ?? '',
    isActive: row.is_active as boolean,
  }
}

function mapService(row: Record<string, unknown>): CatalogService {
  return {
    id: row.id as string,
    name: row.name as string,
    categoryId: row.category_id as string,
    description: (row.description as string) ?? '',
    basePrice: Number(row.base_price ?? 0),
    icon: (row.icon as string) ?? '',
    isActive: row.is_active as boolean,
  }
}

function mapMaterial(row: Record<string, unknown>): CatalogMaterial {
  return {
    id: row.id as string,
    name: row.name as string,
    unit: (row.unit as string) ?? '',
    sellingPrice: Number(row.selling_price ?? 0),
    stockOnHand: Number(row.stock_on_hand ?? 0),
    isActive: row.is_active as boolean,
  }
}

function mapLink(row: Record<string, unknown>): ServiceMaterialLink {
  return {
    serviceId: row.service_id as string,
    inventoryItemId: row.inventory_item_id as string,
    suggestedUnitPrice: Number(row.suggested_unit_price ?? 0),
  }
}

export async function getCatalog(): Promise<CatalogData> {
  const [catRes, svcRes, matRes, linkRes] = await Promise.all([
    supabase
      .from('service_categories')
      .select('id, name, department, icon, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('services')
      .select('id, name, category_id, description, base_price, icon, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('inventory_items')
      .select('id, name, unit, selling_price, stock_on_hand, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('service_material_prices')
      .select('service_id, inventory_item_id, suggested_unit_price'),
  ])

  if (catRes.error) throw catRes.error
  if (svcRes.error) throw svcRes.error
  if (matRes.error) throw matRes.error
  if (linkRes.error) throw linkRes.error

  return {
    categories: (catRes.data ?? []).map(mapCategory),
    services: (svcRes.data ?? []).map(mapService),
    materials: (matRes.data ?? []).map(mapMaterial),
    serviceMaterialLinks: (linkRes.data ?? []).map(mapLink),
  }
}

export async function createService(data: {
  name: string
  categoryId: string
  description: string
  basePrice: number
  icon: string
}) {
  const { error } = await supabase.from('services').insert({
    name: data.name,
    category_id: data.categoryId,
    description: data.description,
    base_price: data.basePrice,
    icon: data.icon,
  })
  if (error) throw error
}

export async function updateService(
  id: string,
  data: Partial<{ name: string; categoryId: string; description: string; basePrice: number; icon: string; isActive: boolean }>,
) {
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.categoryId !== undefined) update.category_id = data.categoryId
  if (data.description !== undefined) update.description = data.description
  if (data.basePrice !== undefined) update.base_price = data.basePrice
  if (data.icon !== undefined) update.icon = data.icon
  if (data.isActive !== undefined) update.is_active = data.isActive
  const { error } = await supabase.from('services').update(update).eq('id', id)
  if (error) throw error
}

export async function deleteService(id: string) {
  const { error } = await supabase.from('services').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function createCategory(data: { name: string; department: string; icon: string }) {
  const { error } = await supabase.from('service_categories').insert({
    name: data.name,
    department: data.department,
    icon: data.icon,
  })
  if (error) throw error
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; department: string; icon: string; isActive: boolean }>,
) {
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.department !== undefined) update.department = data.department
  if (data.icon !== undefined) update.icon = data.icon
  if (data.isActive !== undefined) update.is_active = data.isActive
  const { error } = await supabase.from('service_categories').update(update).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('service_categories').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function createMaterial(data: { name: string; unit: string; sellingPrice: number; stockOnHand: number }) {
  const { error } = await supabase.from('inventory_items').insert({
    name: data.name,
    unit: data.unit,
    selling_price: data.sellingPrice,
    stock_on_hand: data.stockOnHand,
  })
  if (error) throw error
}

export async function updateMaterial(
  id: string,
  data: Partial<{ name: string; unit: string; sellingPrice: number; stockOnHand: number; isActive: boolean }>,
) {
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.unit !== undefined) update.unit = data.unit
  if (data.sellingPrice !== undefined) update.selling_price = data.sellingPrice
  if (data.stockOnHand !== undefined) update.stock_on_hand = data.stockOnHand
  if (data.isActive !== undefined) update.is_active = data.isActive
  const { error } = await supabase.from('inventory_items').update(update).eq('id', id)
  if (error) throw error
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from('inventory_items').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function setServiceMaterials(
  serviceId: string,
  materials: { inventoryItemId: string; suggestedUnitPrice: number }[],
) {
  const { error: delError } = await supabase
    .from('service_material_prices')
    .delete()
    .eq('service_id', serviceId)
  if (delError) throw delError

  if (materials.length > 0) {
    const rows = materials.map((m) => ({
      service_id: serviceId,
      inventory_item_id: m.inventoryItemId,
      suggested_unit_price: m.suggestedUnitPrice,
    }))
    const { error: insError } = await supabase.from('service_material_prices').insert(rows)
    if (insError) throw insError
  }
}
