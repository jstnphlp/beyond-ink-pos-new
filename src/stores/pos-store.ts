import { create } from 'zustand'
import type { DraftPayload } from '@/shared/api/drafts.types'
import type { StaffMember } from '@/shared/api/staff.types'
import type { CatalogData } from '@/shared/api/catalog.types'

// ─── Types ────────────────────────────────────────────────

export type Department = 'Physical' | 'Design' | 'Dev'

export interface ServiceCategory {
  id: string
  name: string
  department: Department
  icon: string
}

export interface Service {
  id: string
  name: string
  description: string
  basePrice: number
  department: Department
  icon: string
  categoryId: string
}

export interface MaterialOption {
  id: string
  name: string
  pricePerUnit: number
  unit: string
  stockLevel: 'normal' | 'low' | 'out'
}

export interface SelectedService {
  service: Service
  materialId: string | null
  quantity: number
}

export interface DeliveryInfo {
  enabled: boolean
  customerName: string
  address: string
  fee: number
}

export interface Discount {
  type: 'amount' | 'percentage'
  value: number
}

export type PaymentMethod = 'cash' | 'gcash' | null

// ─── Mock Data ────────────────────────────────────────────

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'cat-std-print', name: 'Standard Printing', department: 'Physical', icon: 'FileText' },
  { id: 'cat-photo', name: 'Photo Printing', department: 'Physical', icon: 'Image' },
  { id: 'cat-sticker', name: 'Sticker Printing', department: 'Physical', icon: 'Sticker' },
  { id: 'cat-others', name: 'Others', department: 'Physical', icon: 'RectangleHorizontal' },
  { id: 'cat-magazine', name: 'Magazine Printing', department: 'Physical', icon: 'BookOpen' },
  { id: 'cat-binding', name: 'Book Binding', department: 'Physical', icon: 'BookMarked' },
  { id: 'cat-design', name: 'Designing', department: 'Design', icon: 'Palette' },
  { id: 'cat-dev', name: 'Development', department: 'Dev', icon: 'Code2' },
]

export const SERVICES: Service[] = [
  // Standard Printing
  { id: 'std-black', name: 'Standard Printing (Black)', description: 'B&W document printing per page', basePrice: 4, department: 'Physical', icon: 'FileText', categoryId: 'cat-std-print' },
  { id: 'std-color', name: 'Standard Printing (Colored)', description: 'Color document printing per page', basePrice: 7, department: 'Physical', icon: 'FileText', categoryId: 'cat-std-print' },
  { id: 'photocopy-black', name: 'Photocopy / Xerox (Black)', description: 'B&W photocopy per page', basePrice: 2, department: 'Physical', icon: 'Copy', categoryId: 'cat-std-print' },
  { id: 'photocopy-color', name: 'Photocopy / Xerox (Colored)', description: 'Color photocopy per page', basePrice: 7, department: 'Physical', icon: 'Copy', categoryId: 'cat-std-print' },
  { id: 'scanning', name: 'Scanning', description: 'Document scanning service', basePrice: 10, department: 'Physical', icon: 'ScanLine', categoryId: 'cat-std-print' },
  { id: 'hot-laminate', name: 'Hot Laminating', description: 'ID ₱20 · Half ₱35 · A4 ₱50', basePrice: 20, department: 'Physical', icon: 'Layers', categoryId: 'cat-std-print' },
  { id: 'phototop', name: 'Phototop/Coldtop', description: 'Cold laminating film A4', basePrice: 25, department: 'Physical', icon: 'Layers', categoryId: 'cat-std-print' },

  // Photo Printing
  { id: 'photo-2r', name: '2R Photo Print', description: '2R size photo printing', basePrice: 8, department: 'Physical', icon: 'Image', categoryId: 'cat-photo' },
  { id: 'photo-3r', name: '3R Photo Print', description: '3R size photo printing', basePrice: 15, department: 'Physical', icon: 'Image', categoryId: 'cat-photo' },
  { id: 'photo-4r', name: '4R Photo Print', description: '4R size photo printing', basePrice: 20, department: 'Physical', icon: 'Image', categoryId: 'cat-photo' },
  { id: 'photo-a4', name: 'A4 Photo Print', description: 'A4 size photo printing', basePrice: 50, department: 'Physical', icon: 'Image', categoryId: 'cat-photo' },
  { id: 'rush-id', name: 'Rush ID', description: 'Quick ID photo printing', basePrice: 50, department: 'Physical', icon: 'Camera', categoryId: 'cat-photo' },

  // Sticker Printing
  { id: 'custom-sticker', name: 'Custom Stickers/Labels', description: 'Glossy ₱45 · Matte ₱50 · Vinyl ₱50', basePrice: 45, department: 'Physical', icon: 'Sticker', categoryId: 'cat-sticker' },
  { id: 'sintra-sticker', name: 'Sticker on Sintra Board', description: 'Sticker mounted on sintra board', basePrice: 150, department: 'Physical', icon: 'Sticker', categoryId: 'cat-sticker' },

  // Others
  { id: 'certificate', name: 'Certificates & Award', description: 'Specialty ₱25 · Parchment ₱15 · Linen ₱20', basePrice: 15, department: 'Physical', icon: 'Award', categoryId: 'cat-others' },
  { id: 'flyers', name: 'Flyers/Tri-Fold Brochures', description: 'Brochure ₱25 · Inkjet ₱25', basePrice: 25, department: 'Physical', icon: 'FileSpreadsheet', categoryId: 'cat-others' },
  { id: 'business-card', name: 'Business Cards', description: 'Professional business card printing', basePrice: 50, department: 'Physical', icon: 'Contact', categoryId: 'cat-others' },
  { id: 'invitation-card', name: 'Invitation Card', description: 'Passport style invitation card', basePrice: 25, department: 'Physical', icon: 'Mail', categoryId: 'cat-others' },
  { id: 'simple-edit', name: 'Simple Editing', description: 'Basic document editing', basePrice: 20, department: 'Physical', icon: 'Pencil', categoryId: 'cat-others' },

  // Magazine Printing
  { id: 'mag-a4-color', name: 'Magazine (A4, Colored)', description: 'C2S 120gsm A4 per page', basePrice: 35, department: 'Physical', icon: 'BookOpen', categoryId: 'cat-magazine' },
  { id: 'mag-a5-color', name: 'Magazine (A5, Colored)', description: 'C2S 120gsm A5 per page', basePrice: 15, department: 'Physical', icon: 'BookOpen', categoryId: 'cat-magazine' },
  { id: 'mag-a4-bw', name: 'Magazine (A4, Black & White)', description: 'A4 B&W magazine per page', basePrice: 5, department: 'Physical', icon: 'BookOpen', categoryId: 'cat-magazine' },

  // Book Binding
  { id: 'spiral-bind', name: 'Spiral/Coil Binding', description: 'Spiral coil binding per book', basePrice: 50, department: 'Physical', icon: 'BookMarked', categoryId: 'cat-binding' },
  { id: 'tape-bind', name: 'Tape Binding', description: 'Tape binding per book', basePrice: 40, department: 'Physical', icon: 'BookMarked', categoryId: 'cat-binding' },
  { id: 'saddle-bind', name: 'Saddle-Stitch Binding', description: 'Saddle-stitch binding per book', basePrice: 30, department: 'Physical', icon: 'BookMarked', categoryId: 'cat-binding' },
  { id: 'hardbound', name: 'Hard-Bound Binding', description: 'Hardbound binding per book', basePrice: 250, department: 'Physical', icon: 'BookMarked', categoryId: 'cat-binding' },
  { id: 'staple-bind', name: 'Staple Binding', description: 'Staple binding per book', basePrice: 100, department: 'Physical', icon: 'BookMarked', categoryId: 'cat-binding' },

  // Designing
  { id: 'logo-design', name: 'Logo Design', description: 'Custom brand identity and logo', basePrice: 500, department: 'Design', icon: 'Palette', categoryId: 'cat-design' },
  { id: 'brand-pkg', name: 'Brand Identity Package', description: 'Full brand identity package', basePrice: 2000, department: 'Design', icon: 'Palette', categoryId: 'cat-design' },
  { id: 'social-graphics', name: 'Social Media Graphics', description: 'Social platform templates', basePrice: 300, department: 'Design', icon: 'Share2', categoryId: 'cat-design' },
  { id: 'poster-flyer', name: 'Poster/Flyer Design', description: 'Poster and flyer design', basePrice: 200, department: 'Design', icon: 'Image', categoryId: 'cat-design' },
  { id: 'uiux', name: 'UI/UX Design', description: 'User interface design', basePrice: 1500, department: 'Design', icon: 'Layout', categoryId: 'cat-design' },
  { id: 'layout-design', name: 'Layout Design', description: 'Document layout design', basePrice: 150, department: 'Design', icon: 'LayoutGrid', categoryId: 'cat-design' },
  { id: 'photo-editing', name: 'Photo Editing', description: 'Professional photo editing', basePrice: 150, department: 'Design', icon: 'ImagePlus', categoryId: 'cat-design' },
  { id: 'video-editing', name: 'Video Editing', description: 'Video editing service', basePrice: 150, department: 'Design', icon: 'Video', categoryId: 'cat-design' },
  { id: 'motion-graphics', name: 'Motion Graphics', description: 'Animated motion graphics', basePrice: 800, department: 'Design', icon: 'Film', categoryId: 'cat-design' },
  { id: 'video-production', name: 'Video Production', description: 'Full video production', basePrice: 3000, department: 'Design', icon: 'Video', categoryId: 'cat-design' },
  { id: 'animation', name: 'Animation', description: 'Custom animation work', basePrice: 1500, department: 'Design', icon: 'PlayCircle', categoryId: 'cat-design' },

  // Development
  { id: 'biz-website', name: 'Business Website', description: 'Professional business website', basePrice: 5000, department: 'Dev', icon: 'Globe', categoryId: 'cat-dev' },
  { id: 'ecommerce', name: 'E-commerce Site', description: 'Online store development', basePrice: 10000, department: 'Dev', icon: 'ShoppingCart', categoryId: 'cat-dev' },
  { id: 'landing-page', name: 'Landing Page', description: 'Single page landing site', basePrice: 2000, department: 'Dev', icon: 'Monitor', categoryId: 'cat-dev' },
  { id: 'web-app', name: 'Web Application', description: 'Custom web application', basePrice: 15000, department: 'Dev', icon: 'Code2', categoryId: 'cat-dev' },
  { id: 'custom-software', name: 'Custom Software', description: 'Bespoke software development', basePrice: 20000, department: 'Dev', icon: 'Cpu', categoryId: 'cat-dev' },
  { id: 'api-integration', name: 'API Integration', description: 'Third-party API integration', basePrice: 5000, department: 'Dev', icon: 'Plug', categoryId: 'cat-dev' },
  { id: 'db-setup', name: 'Database Setup', description: 'Database design and setup', basePrice: 3000, department: 'Dev', icon: 'Database', categoryId: 'cat-dev' },
  { id: 'tech-consult', name: 'Technical Consultation', description: 'Technical consulting per hour', basePrice: 500, department: 'Dev', icon: 'MessageSquare', categoryId: 'cat-dev' },
]

export const MATERIALS: MaterialOption[] = [
  // Standard Printing — B&W
  { id: 'c0000000-0000-0000-0000-000000000001', name: 'Bond Paper (Short) B&W', pricePerUnit: 4, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000002', name: 'Bond Paper (A4) B&W', pricePerUnit: 4, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'Bond Paper (Long) B&W', pricePerUnit: 5, unit: 'sheet', stockLevel: 'normal' },
  // Standard Printing — Colored
  { id: 'c0000000-0000-0000-0000-000000000060', name: 'Bond Paper (Short) Colored', pricePerUnit: 7, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000061', name: 'Bond Paper (A4) Colored', pricePerUnit: 7, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000062', name: 'Bond Paper (Long) Colored', pricePerUnit: 8, unit: 'sheet', stockLevel: 'normal' },
  // Scanning / Digital
  { id: 'c0000000-0000-0000-0000-000000000005', name: 'Digital Output', pricePerUnit: 10, unit: 'service', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000006', name: 'Digital Output (Editing)', pricePerUnit: 20, unit: 'service', stockLevel: 'normal' },
  // Photo Printing
  { id: 'c0000000-0000-0000-0000-000000000063', name: 'Photo Paper (2R)', pricePerUnit: 8, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000010', name: 'Photo Paper (3R)', pricePerUnit: 15, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000011', name: 'Photo Paper (4R)', pricePerUnit: 20, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000064', name: 'Photo Paper (4R) Rush ID', pricePerUnit: 50, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000012', name: 'Photo Paper (A4)', pricePerUnit: 50, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000065', name: 'Double Sided Glossy Photo (A4)', pricePerUnit: 60, unit: 'sheet', stockLevel: 'normal' },
  // Sticker Printing
  { id: 'c0000000-0000-0000-0000-000000000024', name: 'Sticker (Glossy)', pricePerUnit: 45, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000023', name: 'Sticker (Matte)', pricePerUnit: 50, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000013', name: 'Vinyl Sticker (A4)', pricePerUnit: 50, unit: 'sheet', stockLevel: 'normal' },
  // Sintra Board
  { id: 'c0000000-0000-0000-0000-000000000014', name: 'Sintra Board', pricePerUnit: 150, unit: 'piece', stockLevel: 'normal' },
  // Business Cards
  { id: 'c0000000-0000-0000-0000-000000000015', name: 'Cardstock', pricePerUnit: 50, unit: 'set', stockLevel: 'normal' },
  // Flyers
  { id: 'c0000000-0000-0000-0000-000000000016', name: 'Brochure Paper (A4)', pricePerUnit: 25, unit: 'piece', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000066', name: 'Inkjet Paper (A4)', pricePerUnit: 25, unit: 'piece', stockLevel: 'normal' },
  // Certificates
  { id: 'c0000000-0000-0000-0000-000000000017', name: 'Specialty Board (A4)', pricePerUnit: 25, unit: 'piece', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000067', name: 'Parchment Paper (A4)', pricePerUnit: 15, unit: 'piece', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000068', name: 'Linen Fino White (A4)', pricePerUnit: 20, unit: 'piece', stockLevel: 'normal' },
  // Invitation Card
  { id: 'c0000000-0000-0000-0000-000000000069', name: 'Invitation Card Paper', pricePerUnit: 25, unit: 'piece', stockLevel: 'normal' },
  // Hot Laminating
  { id: 'c0000000-0000-0000-0000-000000000030', name: 'Hot Laminate Film (ID)', pricePerUnit: 20, unit: 'piece', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000031', name: 'Hot Laminate Film (Half)', pricePerUnit: 35, unit: 'piece', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000032', name: 'Hot Laminate Film (A4)', pricePerUnit: 50, unit: 'piece', stockLevel: 'normal' },
  // Cold Laminating
  { id: 'c0000000-0000-0000-0000-000000000070', name: 'Cold Laminating Film (A4)', pricePerUnit: 25, unit: 'piece', stockLevel: 'normal' },
  // Magazine
  { id: 'c0000000-0000-0000-0000-000000000040', name: 'C2S Magazine Paper (A4)', pricePerUnit: 35, unit: 'page', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000042', name: 'C2S Magazine Paper (A5)', pricePerUnit: 15, unit: 'page', stockLevel: 'normal' },
  // Book Binding
  { id: 'c0000000-0000-0000-0000-000000000050', name: 'Spiral/Coil', pricePerUnit: 50, unit: 'book', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000051', name: 'Tape Binding', pricePerUnit: 40, unit: 'book', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000052', name: 'Saddle-Stitch', pricePerUnit: 30, unit: 'book', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000053', name: 'Hard Cover', pricePerUnit: 250, unit: 'book', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000054', name: 'Staple Binding', pricePerUnit: 100, unit: 'book', stockLevel: 'normal' },
  // Specialty
  { id: 'c0000000-0000-0000-0000-000000000071', name: 'Holographic Rainbow', pricePerUnit: 35, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000072', name: 'Matte Paper Double Sided', pricePerUnit: 35, unit: 'sheet', stockLevel: 'normal' },
  { id: 'c0000000-0000-0000-0000-000000000073', name: 'Gray Board', pricePerUnit: 30, unit: 'sheet', stockLevel: 'normal' },
]

export const SERVICE_MATERIAL_MAP: Record<string, string[]> = {
  // Standard Printing — B&W
  'std-black':        ['c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003'],
  'photocopy-black':  ['c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003'],
  // Standard Printing — Colored
  'std-color':        ['c0000000-0000-0000-0000-000000000060', 'c0000000-0000-0000-0000-000000000061', 'c0000000-0000-0000-0000-000000000062'],
  'photocopy-color':  ['c0000000-0000-0000-0000-000000000060', 'c0000000-0000-0000-0000-000000000061', 'c0000000-0000-0000-0000-000000000062'],
  // Photo Printing
  'photo-2r':         ['c0000000-0000-0000-0000-000000000063'],
  'photo-3r':         ['c0000000-0000-0000-0000-000000000010'],
  'photo-4r':         ['c0000000-0000-0000-0000-000000000011'],
  'photo-a4':         ['c0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000065'],
  'rush-id':          ['c0000000-0000-0000-0000-000000000064'],
  // Sticker Printing
  'custom-sticker':   ['c0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000013'],
  'sintra-sticker':   ['c0000000-0000-0000-0000-000000000014'],
  // Scanning / Simple Editing
  'scanning':         ['c0000000-0000-0000-0000-000000000005'],
  'simple-edit':      ['c0000000-0000-0000-0000-000000000006'],
  // Hot Laminating
  'hot-laminate':     ['c0000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000032'],
  // Cold Laminating (Phototop/Coldtop)
  'phototop':         ['c0000000-0000-0000-0000-000000000070'],
  // Business Cards
  'business-card':    ['c0000000-0000-0000-0000-000000000015'],
  // Flyers
  'flyers':           ['c0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000066'],
  // Certificates
  'certificate':      ['c0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000067', 'c0000000-0000-0000-0000-000000000068'],
  // Invitation Card
  'invitation-card':  ['c0000000-0000-0000-0000-000000000069'],
  // Magazine
  'mag-a4-color':     ['c0000000-0000-0000-0000-000000000040'],
  'mag-a5-color':     ['c0000000-0000-0000-0000-000000000042'],
  'mag-a4-bw':        ['c0000000-0000-0000-0000-000000000002'],
  // Book Binding
  'spiral-bind':      ['c0000000-0000-0000-0000-000000000050'],
  'tape-bind':        ['c0000000-0000-0000-0000-000000000051'],
  'saddle-bind':      ['c0000000-0000-0000-0000-000000000052'],
  'hardbound':        ['c0000000-0000-0000-0000-000000000053'],
  'staple-bind':      ['c0000000-0000-0000-0000-000000000054'],
}

export function getMaterialsForService(serviceId: string): MaterialOption[] {
  const materialIds = SERVICE_MATERIAL_MAP[serviceId]
  if (!materialIds) return []
  return MATERIALS.filter((m) => materialIds.includes(m.id))
}

// ─── Catalog resolvers ──────────────────────────────────────

const DEPT_MAP: Record<string, Department> = {
  physical_dept: 'Physical',
  design_dept: 'Design',
  dev_dept: 'Dev',
}

export function resolveCategories(catalog: CatalogData | null): ServiceCategory[] {
  if (!catalog || catalog.categories.length === 0) return SERVICE_CATEGORIES
  return catalog.categories.map((c) => ({
    id: c.id,
    name: c.name,
    department: DEPT_MAP[c.department] ?? 'Physical',
    icon: c.icon || 'FileText',
  }))
}

export function resolveServices(catalog: CatalogData | null): Service[] {
  if (!catalog || catalog.services.length === 0) return SERVICES
  const catDeptMap = new Map(catalog.categories.map((c) => [c.id, DEPT_MAP[c.department] ?? 'Physical' as Department]))
  return catalog.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    basePrice: s.basePrice,
    department: catDeptMap.get(s.categoryId) ?? 'Physical',
    icon: s.icon || 'FileText',
    categoryId: s.categoryId,
  }))
}

export function resolveMaterials(catalog: CatalogData | null): MaterialOption[] {
  if (!catalog || catalog.materials.length === 0) return MATERIALS
  return catalog.materials.map((m) => ({
    id: m.id,
    name: m.name,
    pricePerUnit: m.sellingPrice,
    unit: m.unit,
    stockLevel: m.stockOnHand <= 0 ? 'out' as const : m.stockOnHand <= 10 ? 'low' as const : 'normal' as const,
  }))
}

export function resolveMaterialsForService(serviceId: string, catalog: CatalogData | null): MaterialOption[] {
  if (!catalog || catalog.serviceMaterialLinks.length === 0) return getMaterialsForService(serviceId)
  const materials = resolveMaterials(catalog)
  const ids = new Set(
    catalog.serviceMaterialLinks.filter((l) => l.serviceId === serviceId).map((l) => l.inventoryItemId),
  )
  if (ids.size === 0) return []
  return materials.filter((m) => ids.has(m.id))
}


// ─── Store ────────────────────────────────────────────────

interface PosState {
  // Wizard step
  currentStep: number
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // Catalog (from DB)
  catalog: CatalogData | null
  setCatalog: (data: CatalogData) => void

  // Selected categories (Step 1)
  selectedCategoryIds: string[]
  toggleCategory: (id: string) => void

  // Selected services
  selectedServices: SelectedService[]
  toggleService: (service: Service) => void
  updateServiceMaterial: (serviceId: string, materialId: string) => void
  updateServiceQuantity: (serviceId: string, quantity: number) => void

  // Delivery
  delivery: DeliveryInfo
  setDeliveryEnabled: (enabled: boolean) => void
  setDeliveryField: (field: keyof Omit<DeliveryInfo, 'enabled'>, value: string | number) => void

  // Discount
  discount: Discount
  setDiscountType: (type: 'amount' | 'percentage') => void
  setDiscountValue: (value: number) => void

  // Payment
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  cashReceived: number
  setCashReceived: (amount: number) => void

  // Contributors (Design/Dev)
  contributors: StaffMember[]
  setContributors: (contributors: StaffMember[]) => void

  // Computed
  getSubtotal: () => number
  getDiscountAmount: () => number
  getTotal: () => number
  getChangeDue: () => number

  // Actions
  isCompletable: () => boolean
  resetSale: () => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void

  // Draft
  currentDraftId: string | null
  setCurrentDraftId: (id: string | null) => void
  loadDraft: (id: string, payload: DraftPayload) => void
  isSavingDraft: boolean
  setIsSavingDraft: (v: boolean) => void
}

export const usePosStore = create<PosState>((set, get) => ({
  // Step
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 5) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  // Catalog
  catalog: null,
  setCatalog: (data) => set({ catalog: data }),

  // Selected categories
  selectedCategoryIds: [],
  toggleCategory: (id) =>
    set((s) => {
      const exists = s.selectedCategoryIds.includes(id)
      return {
        selectedCategoryIds: exists
          ? s.selectedCategoryIds.filter((cid) => cid !== id)
          : [...s.selectedCategoryIds, id],
      }
    }),

  // Services
  selectedServices: [],
  toggleService: (service) =>
    set((s) => {
      const exists = s.selectedServices.find((ss) => ss.service.id === service.id)
      if (exists) {
        return { selectedServices: s.selectedServices.filter((ss) => ss.service.id !== service.id) }
      }
      return {
        selectedServices: [
          ...s.selectedServices,
          { service, materialId: null, quantity: 1 },
        ],
      }
    }),
  updateServiceMaterial: (serviceId, materialId) =>
    set((s) => ({
      selectedServices: s.selectedServices.map((ss) =>
        ss.service.id === serviceId ? { ...ss, materialId } : ss
      ),
    })),
  updateServiceQuantity: (serviceId, quantity) =>
    set((s) => ({
      selectedServices: s.selectedServices.map((ss) =>
        ss.service.id === serviceId ? { ...ss, quantity: Math.max(1, quantity) } : ss
      ),
    })),

  // Delivery
  delivery: { enabled: false, customerName: '', address: '', fee: 0 },
  setDeliveryEnabled: (enabled) =>
    set((s) => ({ delivery: { ...s.delivery, enabled } })),
  setDeliveryField: (field, value) =>
    set((s) => ({ delivery: { ...s.delivery, [field]: value } })),

  // Discount
  discount: { type: 'amount', value: 0 },
  setDiscountType: (type) => set((s) => ({ discount: { ...s.discount, type } })),
  setDiscountValue: (value) => set((s) => ({ discount: { ...s.discount, value: Math.max(0, value) } })),

  // Payment
  paymentMethod: null,
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  cashReceived: 0,
  setCashReceived: (amount) => set({ cashReceived: Math.max(0, amount) }),

  // Contributors
  contributors: [],
  setContributors: (contributors) => set({ contributors }),

  // Computed
  getSubtotal: () => {
    const { selectedServices, catalog } = get()
    const materials = resolveMaterials(catalog)
    return selectedServices.reduce((total, ss) => {
      if (!ss.materialId) return total
      const mat = materials.find((m) => m.id === ss.materialId)
      if (!mat) return total
      return total + mat.pricePerUnit * ss.quantity
    }, 0)
  },
  getDiscountAmount: () => {
    const { discount } = get()
    const subtotal = get().getSubtotal()
    if (discount.type === 'percentage') {
      return Math.round((subtotal * Math.min(discount.value, 100)) / 100)
    }
    return Math.min(discount.value, subtotal)
  },
  getTotal: () => {
    const subtotal = get().getSubtotal()
    const discountAmt = get().getDiscountAmount()
    const deliveryFee = get().delivery.enabled ? get().delivery.fee : 0
    return Math.max(0, subtotal - discountAmt + deliveryFee)
  },
  getChangeDue: () => {
    const total = get().getTotal()
    const { cashReceived } = get()
    return Math.max(0, cashReceived - total)
  },

  // Actions
  isCompletable: () => {
    const s = get()
    if (s.currentStep < 5) return false
    if (s.selectedServices.length === 0) return false
    if (!s.paymentMethod) return false
    if (s.paymentMethod === 'cash' && s.cashReceived < s.getTotal()) return false
    return true
  },
  isProcessing: false,
  setIsProcessing: (v) => set({ isProcessing: v }),

  resetSale: () =>
    set({
      currentStep: 1,
      selectedCategoryIds: [],
      selectedServices: [],
      delivery: { enabled: false, customerName: '', address: '', fee: 0 },
      discount: { type: 'amount', value: 0 },
      paymentMethod: null,
      cashReceived: 0,
      contributors: [],
      isProcessing: false,
      currentDraftId: null,
    }),

  // Draft
  currentDraftId: null,
  setCurrentDraftId: (id) => set({ currentDraftId: id }),
  loadDraft: (id, payload) =>
    set({
      currentDraftId: id,
      currentStep: payload.currentStep,
      selectedCategoryIds: [...new Set(payload.selectedServices.map((s) => s.service.categoryId))],
      selectedServices: payload.selectedServices,
      delivery: payload.delivery,
      discount: payload.discount,
      paymentMethod: null,
      cashReceived: 0,
      isProcessing: false,
    }),
  isSavingDraft: false,
  setIsSavingDraft: (v) => set({ isSavingDraft: v }),
}))
