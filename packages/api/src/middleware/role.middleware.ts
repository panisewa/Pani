import type { RequestHandler } from 'express'
import { AppError } from '../lib/errors.js'
import { UserRole } from '@panisewa/shared'
import type { AuthRequest } from '../types/express.js'

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    const authReq = req as AuthRequest
    if (!roles.includes(authReq.user.role as UserRole)) {
      next(new AppError('FORBIDDEN', 403, { required: roles, actual: authReq.user.role }))
      return
    }
    next()
  }
}
