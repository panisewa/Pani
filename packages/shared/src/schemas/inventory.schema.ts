import { z } from 'zod'
import { InventoryLedgerType } from '../types/enums.js'

export const adjustStockSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().refine(n => n !== 0, 'Quantity cannot be zero'),
  note: z.string().max(500).optional(),
})

export const ledgerFilterSchema = z.object({
  product_id: z.string().uuid().optional(),
  type: z.nativeEnum(InventoryLedgerType).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type AdjustStockInput = z.infer<typeof adjustStockSchema>
export type LedgerFilterInput = z.infer<typeof ledgerFilterSchema>
