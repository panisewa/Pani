import axios, { type AxiosError } from 'axios'
import { getAccessToken, updateAccessToken, clearAuth } from './auth-store'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8080/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies on cross-origin requests
  headers: { 'Content-Type': 'application/json' },
})

// Attach accessToken from Zustand on every request
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  failedQueue = []
}

// On 401 — call Next.js BFF refresh route (reads httpOnly cookie server-side)
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers!['Authorization'] = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      // BFF route: reads httpOnly refreshToken cookie, returns new accessToken
      const { data } = await axios.post<{ accessToken: string }>('/api/auth/refresh')
      updateAccessToken(data.accessToken)
      processQueue(null, data.accessToken)
      original.headers!['Authorization'] = `Bearer ${data.accessToken}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearAuth()
      window.location.href = '/en/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export type ApiResponse<T> = {
  success: boolean
  data: T
  meta?: { page: number; limit: number; total: number }
  error?: { code: string; message: string }
}
