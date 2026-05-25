import type { OrderStatus, PaymentMethod, PaymentStatus, CustomerType } from '@panisewa/shared'

export interface IOrderItem {
  id: string
  orderId: string
  tenantId: string
  productId: string
  quantity: number
  unitPrice: number
  depositAmount: number
  subtotal: number
}

export interface IOrder {
  id: string
  tenantId: string
  orderNumber: string
  customerId: string
  type: CustomerType
  status: OrderStatus
  assignedDriverId: string | null
  scheduledDate: string | null
  deliveryAddress: Record<string, unknown> | null
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  subtotal: number
  vatAmount: number
  total: number
  emptiesCollected: number
  deliveryPhotoUrl: string | null
  notes: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  items?: IOrderItem[]
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'] as OrderStatus[],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'] as OrderStatus[],
  ASSIGNED: ['OUT_FOR_DELIVERY'] as OrderStatus[],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'] as OrderStatus[],
  DELIVERED: [] as OrderStatus[],
  FAILED: [] as OrderStatus[],
  CANCELLED: [] as OrderStatus[],
} as Record<OrderStatus, OrderStatus[]>
