import { Router } from 'express'
import type { IRouter } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { UserRole } from '@panisewa/shared'
import {
  createInvoiceHandler,
  getInvoicesHandler,
  getInvoiceByIdHandler,
  sendInvoiceHandler,
  markPaidHandler,
  agingReportHandler,
} from './invoice.controller.js'

export const invoiceRouter: IRouter = Router()

invoiceRouter.use(authMiddleware, tenantMiddleware)

invoiceRouter.get(
  '/aging-report',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  agingReportHandler
)

invoiceRouter.get('/', getInvoicesHandler)
invoiceRouter.get('/:id', getInvoiceByIdHandler)

invoiceRouter.post(
  '/',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  createInvoiceHandler
)

invoiceRouter.post(
  '/:id/send',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  sendInvoiceHandler
)

invoiceRouter.post(
  '/:id/mark-paid',
  requireRole(UserRole.TENANT_ADMIN, UserRole.MANAGER),
  markPaidHandler
)
