import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────

export type Department = 'Physical' | 'Design' | 'Dev'

export interface Service {
  id: string
  name: string
  description: string
  basePrice: number
  department: Department
  icon: string // lucide icon name
}

export interface MaterialOption {
  id: string
  name: string
  pricePerUnit: number
  unit: string
  stockLevel: 'normal' | 'low' | 'out'
}

export interface AddOn {
  id: string
  name: string
  price: number
}

export interface SelectedService {
  service: Service
  materialId: string | null
  quantity: number
  addOns: string[] // add-on IDs
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

export const SERVICES: Service[] = [
  { id: 'doc-print', name: 'Document Printing', description: 'Standard B&W or color document printing', basePrice: 5, department: 'Physical', icon: 'FileText' },
  { id: 'photo-print', name: 'Photo Prints', description: 'High-quality photo printing, various sizes', basePrice: 25, department: 'Physical', icon: 'Image' },
  { id: 'stickers', name: 'Custom Stickers', description: 'Die-cut vinyl or paper stickers', basePrice: 50, department: 'Physical', icon: 'Sticker' },
  { id: 'tarp', name: 'Tarpaulin Printing', description: 'Large format banners and tarps', basePrice: 200, department: 'Physical', icon: 'RectangleHorizontal' },
  { id: 'layout', name: 'Layout Design', description: 'Professional document and print layout', basePrice: 150, department: 'Design', icon: 'LayoutGrid' },
  { id: 'logo', name: 'Logo Design', description: 'Custom brand identity and logo creation', basePrice: 500, department: 'Design', icon: 'Palette' },
  { id: 'social', name: 'Social Media Kit', description: 'Templates and assets for social platforms', basePrice: 300, department: 'Design', icon: 'Share2' },
  { id: 'web-dev', name: 'Web Development', description: 'Custom website development and deployment', basePrice: 2000, department: 'Dev', icon: 'Code2' },
]

export const MATERIALS: MaterialOption[] = [
  { id: 'a4-bond', name: 'A4 Bond Paper', pricePerUnit: 1, unit: 'sheet', stockLevel: 'normal' },
  { id: 'a4-glossy', name: 'A4 Glossy Paper', pricePerUnit: 5, unit: 'sheet', stockLevel: 'low' },
  { id: 'photo-4r', name: '4R Photo Paper', pricePerUnit: 8, unit: 'sheet', stockLevel: 'normal' },
  { id: 'photo-a4', name: 'A4 Photo Paper', pricePerUnit: 15, unit: 'sheet', stockLevel: 'normal' },
  { id: 'vinyl-a4', name: 'A4 Vinyl Sticker', pricePerUnit: 20, unit: 'sheet', stockLevel: 'low' },
  { id: 'vinyl-roll', name: 'Vinyl Roll (per ft)', pricePerUnit: 35, unit: 'foot', stockLevel: 'normal' },
  { id: 'tarp-sqft', name: 'Tarpaulin (per sq ft)', pricePerUnit: 12, unit: 'sq ft', stockLevel: 'normal' },
]

export const ADD_ONS: AddOn[] = [
  { id: 'laminate', name: 'Laminating', price: 15 },
  { id: 'specialty-cut', name: 'Specialty Cuts', price: 25 },
  { id: 'rush', name: 'Rush Processing', price: 50 },
  { id: 'mounting', name: 'Foam Board Mounting', price: 40 },
  { id: 'grommets', name: 'Grommets / Eyelets', price: 30 },
]

// ─── Store ────────────────────────────────────────────────

interface PosState {
  // Wizard step
  currentStep: number
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // Selected services
  selectedServices: SelectedService[]
  toggleService: (service: Service) => void
  updateServiceMaterial: (serviceId: string, materialId: string) => void
  updateServiceQuantity: (serviceId: string, quantity: number) => void
  toggleServiceAddOn: (serviceId: string, addOnId: string) => void

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
  gcashRef: string
  setGcashRef: (ref: string) => void

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
}

export const usePosStore = create<PosState>((set, get) => ({
  // Step
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 4) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

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
          { service, materialId: null, quantity: 1, addOns: [] },
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
  toggleServiceAddOn: (serviceId, addOnId) =>
    set((s) => ({
      selectedServices: s.selectedServices.map((ss) => {
        if (ss.service.id !== serviceId) return ss
        const has = ss.addOns.includes(addOnId)
        return {
          ...ss,
          addOns: has ? ss.addOns.filter((a) => a !== addOnId) : [...ss.addOns, addOnId],
        }
      }),
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
  gcashRef: '',
  setGcashRef: (ref) => set({ gcashRef: ref }),

  // Computed
  getSubtotal: () => {
    const { selectedServices } = get()
    return selectedServices.reduce((total, ss) => {
      let serviceTotal = ss.service.basePrice * ss.quantity
      if (ss.materialId) {
        const mat = MATERIALS.find((m) => m.id === ss.materialId)
        if (mat) serviceTotal += mat.pricePerUnit * ss.quantity
      }
      const addOnTotal = ss.addOns.reduce((sum, aId) => {
        const addon = ADD_ONS.find((a) => a.id === aId)
        return sum + (addon?.price ?? 0)
      }, 0)
      return total + serviceTotal + addOnTotal
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
    if (s.currentStep < 4) return false
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
      selectedServices: [],
      delivery: { enabled: false, customerName: '', address: '', fee: 0 },
      discount: { type: 'amount', value: 0 },
      paymentMethod: null,
      cashReceived: 0,
      gcashRef: '',
      isProcessing: false,
    }),
}))
