import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CustomerType,
  ProductCategory,
  InvoiceStatus,
} from '@panisewa/shared'

export interface IOrderItem {
  id: string
  productId: string
  productNameEn: string
  productNameNe: string
  quantity: number
  unitPrice: number
  depositAmount: number
  subtotal: number
}

export interface IOrder {
  id: string
  orderNumber: string
  customerId: string
  customerName?: string
  type: CustomerType
  status: OrderStatus
  assignedDriverId: string | null
  scheduledDate: string | null
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  subtotal: number
  vatAmount: number
  total: number
  emptiesCollected: number
  notes: string | null
  createdAt: string
  updatedAt: string
  items?: IOrderItem[]
}

export interface ICustomer {
  id: string
  type: CustomerType
  name: string
  phone: string | null
  email: string | null
  address: Record<string, string> | null
  creditLimit: number
  creditTerms: 'net30' | 'net60' | 'net90' | null
  notes: string | null
  isActive: boolean
  createdAt: string
}

export interface IProduct {
  id: string
  nameEn: string
  nameNe: string
  sku: string | null
  category: ProductCategory | null
  priceB2c: number
  priceB2b: number
  depositAmount: number
  reorderLevel: number
  isActive: boolean
  imageUrl: string | null
  createdAt: string
}

export interface InvoiceItem {
  id: string
  productId: string
  productNameEn: string
  productNameNe: string
  quantity: number
  unitPrice: number
  depositAmount: number
  subtotal: number
}

export interface IInvoice {
  id: string
  invoiceNumber: string
  orderId: string | null
  customerId: string
  status: InvoiceStatus
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  dueDate: string | null
  paidAt: string | null
  bsDate: string | null
  createdAt: string
  pdfUrl?: string
  customerName?: string
  customerAddress?: Record<string, string> | null
  items?: InvoiceItem[]
}

export interface ITenant {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  status: string
  plan: string
  settings: {
    vatRegistered?: boolean
    panNumber?: string
    fiscalYear?: string
    defaultLanguage?: string
    timezone?: string
    address?: string
    phone?: string
    customDocumentTypes?: boolean
  }
  createdAt: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: { total: number; page: number; limit: number }
}

export interface SingleResponse<T> {
  success: boolean
  data: T
}
