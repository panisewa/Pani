import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8080/api/v1'
const IS_PROD = process.env.NODE_ENV === 'production'

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown

  const upstream = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = await upstream.json() as {
    success: boolean
    data?: {
      accessToken: string
      refreshToken: string
      expiresIn: number
      user: {
        id: string
        email: string
        role: string
        tenantId: string
        firstName: string | null
        lastName: string | null
      }
    }
    error?: { code: string; message: string }
  }

  if (!upstream.ok || !payload.success || !payload.data) {
    return NextResponse.json(payload, { status: upstream.status })
  }

  const { refreshToken, ...clientData } = payload.data

  const res = NextResponse.json({ success: true, data: clientData }, { status: 200 })

  // Store refreshToken in httpOnly cookie — not accessible from JS
  res.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return res
}
