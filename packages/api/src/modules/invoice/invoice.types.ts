import type { InvoiceStatus, PaymentMethod } from '@panisewa/shared'

export interface IInvoice {
  id: string
  tenantId: string
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
  paymentMethod: PaymentMethod | null
  pdfUrl: string | null
  bsDate: string | null
  createdAt: string
}

export interface IAgingBucket {
  bucket: '0-30' | '31-60' | '61-90' | '90+'
  count: number
  totalAmount: number
  invoices: IInvoice[]
}
