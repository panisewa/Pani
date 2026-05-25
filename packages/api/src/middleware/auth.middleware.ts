import type { RequestHandler, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../lib/errors.js'
import type { AuthRequest } from '../types/express.js'
import type { UserRole } from '@panisewa/shared'

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) throw new AppError('UNAUTHORIZED', 401)

    const token = header.slice(7)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) throw new AppError('UNAUTHORIZED', 401)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, tenant_id, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) throw new AppError('UNAUTHORIZED', 401)
    if (!profile.is_active) throw new AppError('ACCOUNT_DISABLED', 403)

    const authReq = req as AuthRequest
    authReq.user = {
      id: user.id,
      role: profile.role as UserRole,
      tenantId: profile.tenant_id ?? '',
    }

    next()
  } catch (err) {
    next(err)
  }
}

export type AuthHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void
