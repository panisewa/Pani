import { Router } from 'express'
import type { IRouter } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { UserRole } from '@panisewa/shared'
import {
  createOrderHandler,
  getOrdersHandler,
  getOrderByIdHandler,
  updateOrderHandler,
  confirmOrderHandler,
  assignDriverHandler,
  outForDeliveryHandler,
  confirmDeliveryHandler,
  cancelOrderHandler,
  driverTodayOrdersHandler,
} from './order.controller.js'

export const orderRouter: IRouter = Router()

orderRouter.use(authMiddleware, tenantMiddleware)

orderRouter.get(
  '/driver/today',
  requireRole(UserRole.DRIVER),
  driverTodayOrdersHandler
)

orderRouter.get('/', getOrdersHandler)
orderRouter.get('/:id', getOrderByIdHandler)

orderRouter.post(
  '/',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  createOrderHandler
)

orderRouter.patch(
  '/:id',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  updateOrderHandler
)

orderRouter.post(
  '/:id/confirm',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  confirmOrderHandler
)

orderRouter.post(
  '/:id/assign-driver',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  assignDriverHandler
)

orderRouter.post(
  '/:id/out-for-delivery',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.DRIVER),
  outForDeliveryHandler
)

orderRouter.post(
  '/:id/deliver',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.DRIVER),
  confirmDeliveryHandler
)

orderRouter.post(
  '/:id/cancel',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  cancelOrderHandler
)
