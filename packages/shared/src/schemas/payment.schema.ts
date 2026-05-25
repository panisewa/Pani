import { z } from 'zod'

export const esewaInitiateSchema = z.object({
  invoice_id: z.string().uuid(),
  success_url: z.string().url(),
  failure_url: z.string().url(),
})

export const esewaVerifySchema = z.object({
  data: z.string().min(1),
})

export const khaltiInitiateSchema = z.object({
  invoice_id: z.string().uuid(),
  return_url: z.string().url(),
})

export const khaltiVerifySchema = z.object({
  pidx: z.string().min(1),
})

export type EsewaInitiateInput = z.infer<typeof esewaInitiateSchema>
export type EsewaVerifyInput = z.infer<typeof esewaVerifySchema>
export type KhaltiInitiateInput = z.infer<typeof khaltiInitiateSchema>
export type KhaltiVerifyInput = z.infer<typeof khaltiVerifySchema>
