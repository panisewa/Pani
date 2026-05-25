export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
