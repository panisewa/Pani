import { Router, type IRouter } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import { getDashboardStatsHandler } from './stats.controller.js'

export const statsRouter: IRouter = Router()

statsRouter.use(authMiddleware, tenantMiddleware)

statsRouter.get('/dashboard', getDashboardStatsHandler)
