import { Router } from 'express'
import type { IRouter } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { UserRole } from '@panisewa/shared'
import {
  createCustomerHandler,
  getCustomersHandler,
  getCustomerByIdHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
} from './customer.controller.js'

export const customerRouter: IRouter = Router()

customerRouter.use(authMiddleware, tenantMiddleware)

customerRouter.get('/', getCustomersHandler)
customerRouter.get('/:id', getCustomerByIdHandler)

customerRouter.post(
  '/',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  createCustomerHandler
)
customerRouter.patch(
  '/:id',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  updateCustomerHandler
)
customerRouter.delete(
  '/:id',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  deleteCustomerHandler
)
