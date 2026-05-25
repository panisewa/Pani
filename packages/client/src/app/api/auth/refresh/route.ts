import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8080/api/v1'
const IS_PROD = process.env.NODE_ENV === 'production'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ success: false, error: { code: 'NO_REFRESH_TOKEN' } }, { status: 401 })
  }

  const upstream = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const payload = await upstream.json() as {
    success: boolean
    data?: { accessToken: string; refreshToken: string; expiresIn: number }
    error?: { code: string; message: string }
  }

  if (!upstream.ok || !payload.success || !payload.data) {
    // Clear stale cookie on failure
    const res = NextResponse.json(payload, { status: upstream.status })
    res.cookies.delete('refresh_token')
    return res
  }

  const { refreshToken: newRefreshToken, accessToken } = payload.data

  const res = NextResponse.json({ accessToken }, { status: 200 })

  // Rotate the refresh token cookie
  res.cookies.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7,
  })

  return res
}
