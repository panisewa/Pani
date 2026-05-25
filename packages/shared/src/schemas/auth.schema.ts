import { z } from 'zod'
import { NEPAL_PHONE_REGEX } from '../constants/index.js'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerTenantSchema = z.object({
  // Tenant
  tenantName: z.string().min(2).max(100),
  tenantSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  // Admin user
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().regex(NEPAL_PHONE_REGEX, 'Invalid Nepal phone number').optional(),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterTenantInput = z.infer<typeof registerTenantSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
