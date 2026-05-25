import { Router } from 'express'
import type { IRouter } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { UserRole } from '@panisewa/shared'
import {
  getStockHandler,
  getLedgerHandler,
  adjustStockHandler,
  getLowStockHandler,
} from './inventory.controller.js'

export const inventoryRouter: IRouter = Router()

inventoryRouter.use(authMiddleware, tenantMiddleware)

inventoryRouter.get('/stock', getStockHandler)
inventoryRouter.get('/stock/:productId', getStockHandler)
inventoryRouter.get('/ledger', getLedgerHandler)
inventoryRouter.get(
  '/low-stock',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  getLowStockHandler
)
inventoryRouter.post(
  '/adjust',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  adjustStockHandler
)
