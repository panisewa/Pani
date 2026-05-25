import { z } from 'zod'
import { PaymentMethod } from '../types/enums.js'

export const createInvoiceSchema = z.object({
  order_id: z.string().uuid().optional(),
  customer_id: z.string().uuid(),
  due_date: z.string().optional(),
})

export const markPaidSchema = z.object({
  payment_method: z.nativeEnum(PaymentMethod),
  paid_at: z.string().datetime().optional(),
})

export const invoiceFilterSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  customer_id: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type MarkPaidInput = z.infer<typeof markPaidSchema>
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>
