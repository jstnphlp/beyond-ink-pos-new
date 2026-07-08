export interface Product {
  id: string
  name: string
  price: number
  sku: string
  category: string
  stock: number
  created_at: string
}

export interface Transaction {
  id: string
  total: number
  status: 'pending' | 'completed' | 'refunded'
  items: TransactionItem[]
  created_at: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  unit_price: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}
