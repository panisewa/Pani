import type { RequestHandler } from 'express'
import * as authService from './auth.service.js'
import { loginSchema, registerTenantSchema, refreshTokenSchema } from '@panisewa/shared'
import { AppError } from '../../lib/errors.js'
import type { AuthRequest } from '../../types/express.js'

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) throw new AppError('VALIDATION_ERROR', 400, body.error.flatten())

    const data = await authService.login(body.data)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const body = registerTenantSchema.safeParse(req.body)
    if (!body.success) throw new AppError('VALIDATION_ERROR', 400, body.error.flatten())

    const data = await authService.registerTenant(body.data)
    res.status(201).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const body = refreshTokenSchema.safeParse(req.body)
    if (!body.success) throw new AppError('VALIDATION_ERROR', 400, body.error.flatten())

    const data = await authService.refreshToken(body.data.refreshToken)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export const logoutHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    await authService.logout(authReq.user.id)
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
}
