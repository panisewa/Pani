import type { UserRole } from '@panisewa/shared'

export interface JWTPayload {
  sub: string       // user id (auth.users.id)
  role: UserRole
  tenantId: string
  iat?: number
  exp?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    role: UserRole
    tenantId: string
    firstName: string | null
    lastName: string | null
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterTenantRequest {
  tenantName: string
  tenantSlug: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}
