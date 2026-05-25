export class AppError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly details?: unknown

  constructor(code: string, statusCode: number, details?: unknown) {
    super(code)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(process.env['NODE_ENV'] !== 'production' && { details: this.details }),
      },
    }
  }
}
