import type { RequestHandler } from 'express'
import type { AuthRequest } from '../../types/express.js'
import { getDashboardStats } from './stats.service.js'

export const getDashboardStatsHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const stats = await getDashboardStats(authReq.tenant!.id)
    res.json({ success: true, data: stats })
  } catch (err) {
    next(err)
  }
}
