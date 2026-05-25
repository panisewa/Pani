import { Router, type IRouter } from 'express'
import { loginHandler, registerHandler, refreshHandler, logoutHandler } from './auth.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { authRateLimit } from '../../middleware/rate-limit.middleware.js'

export const authRouter: IRouter = Router()

authRouter.post('/login', authRateLimit, loginHandler)
authRouter.post('/register', authRateLimit, registerHandler)
authRouter.post('/refresh', authRateLimit, refreshHandler)
authRouter.post('/logout', authMiddleware, logoutHandler)
