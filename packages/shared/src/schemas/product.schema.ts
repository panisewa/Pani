import { z } from 'zod'
import { ProductCategory } from '../types/enums.js'

export const createProductSchema = z.object({
  name_en: z.string().min(1).max(200),
  name_ne: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  price_b2c: z.number().int().min(0),   // paisa
  price_b2b: z.number().int().min(0),   // paisa
  deposit_amount: z.number().int().min(0).default(0),
  reorder_level: z.number().int().min(0).default(10),
})

export const updateProductSchema = createProductSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
