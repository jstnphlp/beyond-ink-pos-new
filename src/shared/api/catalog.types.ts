export interface CatalogCategory {
  id: string
  name: string
  department: string
  icon: string
  isActive: boolean
}

export interface CatalogService {
  id: string
  name: string
  categoryId: string
  description: string
  basePrice: number
  icon: string
  isActive: boolean
}

export interface CatalogMaterial {
  id: string
  name: string
  unit: string
  costPerUnit: number
  stockOnHand: number
  isActive: boolean
}

export interface ServiceMaterialLink {
  serviceId: string
  inventoryItemId: string
  suggestedUnitPrice: number
}

export interface CatalogData {
  categories: CatalogCategory[]
  services: CatalogService[]
  materials: CatalogMaterial[]
  serviceMaterialLinks: ServiceMaterialLink[]
}
