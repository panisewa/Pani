import { z } from 'zod'
import { OrderStatus, PaymentMethod, CustomerType } from '../types/enums.js'

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
})

export const createOrderSchema = z.object({
  customer_id: z.string().uuid(),
  type: z.nativeEnum(CustomerType),
  items: z.array(orderItemSchema).min(1),
  scheduled_date: z.string().optional(),
  delivery_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      province: z.string().optional(),
    })
    .optional(),
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().max(1000).optional(),
})

export const updateOrderSchema = z.object({
  scheduled_date: z.string().optional(),
  delivery_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      province: z.string().optional(),
    })
    .optional(),
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  notes: z.string().max(1000).optional(),
})

export const assignDriverSchema = z.object({
  driver_id: z.string().uuid(),
})

export const confirmDeliverySchema = z.object({
  empties_collected: z.number().int().min(0).default(0),
  delivery_photo_url: z.string().url().optional(),
})

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const orderFilterSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  type: z.nativeEnum(CustomerType).optional(),
  driver_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type AssignDriverInput = z.infer<typeof assignDriverSchema>
export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type OrderFilterInput = z.infer<typeof orderFilterSchema>
