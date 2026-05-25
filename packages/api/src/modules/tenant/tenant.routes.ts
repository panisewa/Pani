import { Router, type IRouter } from 'express'
import { getTenantHandler, updateSettingsHandler, getUsageHandler } from './tenant.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { UserRole } from '@panisewa/shared'

export const tenantRouter: IRouter = Router()

tenantRouter.use(authMiddleware, tenantMiddleware)

tenantRouter.get('/', getTenantHandler)
tenantRouter.patch('/settings', requireRole(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN), updateSettingsHandler)
tenantRouter.get('/usage', requireRole(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN), getUsageHandler)
