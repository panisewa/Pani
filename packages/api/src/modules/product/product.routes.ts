import { Router } from 'express'
import type { IRouter } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { UserRole } from '@panisewa/shared'
import {
  createProductHandler,
  getProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
  uploadProductImageHandler,
} from './product.controller.js'

export const productRouter: IRouter = Router()

productRouter.use(authMiddleware, tenantMiddleware)

productRouter.get('/', getProductsHandler)
productRouter.get('/:id', getProductByIdHandler)

productRouter.post(
  '/',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  createProductHandler
)

productRouter.patch(
  '/:id',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  updateProductHandler
)

productRouter.delete(
  '/:id',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  deleteProductHandler
)

productRouter.put(
  '/:id/image',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  uploadProductImageHandler
)
