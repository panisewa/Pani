import { z } from 'zod'
import { CustomerType } from '../types/enums.js'

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
})

export const createCustomerSchema = z.object({
  type: z.nativeEnum(CustomerType).default(CustomerType.B2C),
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: addressSchema.optional(),
  credit_limit: z.number().int().min(0).default(0),
  credit_terms: z.enum(['net30', 'net60', 'net90']).optional(),
  notes: z.string().max(1000).optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export const customerFilterSchema = z.object({
  type: z.nativeEnum(CustomerType).optional(),
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>
