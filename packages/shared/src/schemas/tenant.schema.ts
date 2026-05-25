import { z } from 'zod'
import { NEPAL_PHONE_REGEX } from '../constants/index.js'

export const tenantSettingsSchema = z.object({
  vatRegistered: z.boolean().optional(),
  panNumber: z.string().length(9).optional(),
  fiscalYear: z.string().optional(),
  defaultLanguage: z.enum(['en', 'ne']).optional(),
  timezone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      province: z.number().int().min(1).max(7).optional(),
    })
    .optional(),
  phone: z.string().regex(NEPAL_PHONE_REGEX).optional(),
})

export const updateSettingsSchema = tenantSettingsSchema

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
