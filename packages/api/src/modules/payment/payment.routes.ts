import { Router } from 'express'
import type { IRouter } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { tenantMiddleware } from '../../middleware/tenant.middleware.js'
import {
  esewaInitiateHandler,
  esewaVerifyHandler,
  khaltiInitiateHandler,
  khaltiVerifyHandler,
} from './payment.controller.js'

export const paymentRouter: IRouter = Router()

paymentRouter.use(authMiddleware, tenantMiddleware)

paymentRouter.post('/esewa/initiate', esewaInitiateHandler)
paymentRouter.post('/esewa/verify', esewaVerifyHandler)
paymentRouter.post('/khalti/initiate', khaltiInitiateHandler)
paymentRouter.post('/khalti/verify', khaltiVerifyHandler)
