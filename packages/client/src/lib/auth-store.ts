import { create } from 'zustand'
import type { UserRole } from '@panisewa/shared'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  tenantId: string
  firstName: string | null
  lastName: string | null
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  setAuth: (accessToken: string, user: AuthUser) => void
  updateToken: (accessToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  updateToken: (accessToken) => set((state) => ({ ...state, accessToken })),
  clearAuth: () => set({ accessToken: null, user: null }),
}))

// Non-hook accessor for use outside React (e.g. axios interceptor)
export const getAccessToken = () => useAuthStore.getState().accessToken
export const updateAccessToken = (token: string) => useAuthStore.getState().updateToken(token)
export const clearAuth = () => useAuthStore.getState().clearAuth()
