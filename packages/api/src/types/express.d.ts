import type { Request } from 'express'

/** Extended Request after authMiddleware runs */
export interface AuthRequest extends Request {
  user: {
    id: string
    role: string
    tenantId: string
  }
  tenant?: {
    id: string
    name: string
    slug: string
    status: string
    plan: string
    settings: Record<string, unknown>
  }
}
