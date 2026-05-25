import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../lib/errors.js'

// Mock supabase lib before importing service
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
        signOut: vi.fn(),
      },
    },
    from: vi.fn(),
  },
}))

import { supabase, supabaseAdmin } from '../../lib/supabase.js'
import * as authService from './auth.service.js'

const mockFrom = (returnValue: unknown) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
  }
  vi.mocked(supabaseAdmin.from).mockReturnValue(chain as never)
  return chain
}

describe('auth.service', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('login()', () => {
    it('returns AuthResponse on valid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'a@b.com' },
          session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
        },
        error: null,
      } as never)

      mockFrom({
        data: { role: 'TENANT_ADMIN', tenant_id: 'tenant-1', first_name: 'A', last_name: 'B', is_active: true },
        error: null,
      })

      const result = await authService.login({ email: 'a@b.com', password: 'password123' })

      expect(result.accessToken).toBe('at')
      expect(result.user.role).toBe('TENANT_ADMIN')
      expect(result.user.tenantId).toBe('tenant-1')
    })

    it('throws INVALID_CREDENTIALS on bad password', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      } as never)

      await expect(authService.login({ email: 'a@b.com', password: 'wrong' }))
        .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 })
    })

    it('throws TENANT_NOT_FOUND when user has no tenant', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'a@b.com' },
          session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
        },
        error: null,
      } as never)

      mockFrom({
        data: { role: 'SUPER_ADMIN', tenant_id: null, first_name: 'A', last_name: 'B' },
        error: null,
      })

      await expect(authService.login({ email: 'a@b.com', password: 'password123' }))
        .rejects.toMatchObject({ code: 'TENANT_NOT_FOUND', statusCode: 403 })
    })
  })

  describe('refreshToken()', () => {
    it('returns new tokens on valid refresh token', async () => {
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'a@b.com' },
          session: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600 },
        },
        error: null,
      } as never)

      mockFrom({
        data: { role: 'TENANT_ADMIN', tenant_id: 'tenant-1', first_name: 'A', last_name: 'B' },
        error: null,
      })

      const result = await authService.refreshToken('old-rt')
      expect(result.accessToken).toBe('new-at')
    })

    it('throws INVALID_REFRESH_TOKEN on bad token', async () => {
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid token' },
      } as never)

      await expect(authService.refreshToken('bad'))
        .rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN', statusCode: 401 })
    })
  })

  describe('logout()', () => {
    it('succeeds when supabase signOut resolves', async () => {
      vi.mocked(supabaseAdmin.auth.admin.signOut).mockResolvedValue({ error: null } as never)
      await expect(authService.logout('user-1')).resolves.toBeUndefined()
    })

    it('throws LOGOUT_FAILED on supabase error', async () => {
      vi.mocked(supabaseAdmin.auth.admin.signOut).mockResolvedValue({
        error: { message: 'Network error' },
      } as never)
      await expect(authService.logout('user-1'))
        .rejects.toMatchObject({ code: 'LOGOUT_FAILED', statusCode: 500 })
    })
  })

  describe('AppError', () => {
    it('serializes correctly in non-production', () => {
      process.env['NODE_ENV'] = 'development'
      const err = new AppError('TEST_ERR', 422, { field: 'email' })
      const json = err.toJSON()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('TEST_ERR')
      expect(json.error.details).toEqual({ field: 'email' })
    })
  })
})
