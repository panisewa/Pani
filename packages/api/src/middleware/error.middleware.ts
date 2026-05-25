import type { ErrorRequestHandler } from 'express'
import { AppError } from '../lib/errors.js'

export const errorMiddleware: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON())
    return
  }

  if (err instanceof Error) {
    console.error('[Unhandled Error]', err)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env['NODE_ENV'] === 'production'
          ? 'Something went wrong'
          : err.message,
      },
    })
    return
  }

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unknown error' },
  })
}
