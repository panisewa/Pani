import type { RequestHandler } from 'express'
import * as tenantService from './tenant.service.js'
import { updateSettingsSchema } from '@panisewa/shared'
import { AppError } from '../../lib/errors.js'
import type { AuthRequest } from '../../types/express.js'

export const getTenantHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const data = await tenantService.getTenant(authReq.user.tenantId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export const updateSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const body = updateSettingsSchema.safeParse(req.body)
    if (!body.success) throw new AppError('VALIDATION_ERROR', 400, body.error.flatten())

    const data = await tenantService.updateSettings(authReq.user.tenantId, body.data)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export const getUsageHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const tenant = await tenantService.getTenant(authReq.user.tenantId)
    const data = await tenantService.getUsageStats(authReq.user.tenantId, tenant.plan)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}
