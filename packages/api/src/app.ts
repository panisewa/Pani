import express, { type Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { generalRateLimit } from './middleware/rate-limit.middleware.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { tenantRouter } from './modules/tenant/tenant.routes.js'
import { productRouter } from './modules/product/product.routes.js'
import { inventoryRouter } from './modules/inventory/inventory.routes.js'
import { customerRouter } from './modules/customer/customer.routes.js'
import { orderRouter } from './modules/order/order.routes.js'
import { invoiceRouter } from './modules/invoice/invoice.routes.js'
import { paymentRouter } from './modules/payment/payment.routes.js'
import { statsRouter } from './modules/stats/stats.routes.js'

export const app: Application = express()

app.use(helmet())

app.use(cors({
  origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  credentials: true,
}))

app.use(morgan(process.env['NODE_ENV'] === 'production' ? 'combined' : 'dev'))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(generalRateLimit)

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '0.1.0',
    },
  })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/tenant', tenantRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/inventory', inventoryRouter)
app.use('/api/v1/customers', customerRouter)
app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/invoices', invoiceRouter)
app.use('/api/v1/payments', paymentRouter)
app.use('/api/v1/stats', statsRouter)

app.use(errorMiddleware)
