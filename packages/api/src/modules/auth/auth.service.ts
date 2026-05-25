import { supabase, supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { UserRole } from '@panisewa/shared'
import type { AuthResponse, LoginRequest, RegisterTenantRequest } from './auth.types.js'

async function fetchUserProfile(userId: string): Promise<{ role: UserRole; tenantId: string; firstName: string | null; lastName: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role, tenant_id, first_name, last_name')
    .eq('id', userId)
    .single()

  if (error || !data) throw new AppError('USER_NOT_FOUND', 404, { userId })

  return {
    role: data.role as UserRole,
    tenantId: data.tenant_id ?? '',
    firstName: data.first_name,
    lastName: data.last_name,
  }
}

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: req.email,
    password: req.password,
  })

  if (error || !data.user || !data.session) {
    throw new AppError('INVALID_CREDENTIALS', 401)
  }

  const profile = await fetchUserProfile(data.user.id)

  if (!profile.tenantId) throw new AppError('TENANT_NOT_FOUND', 403)

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      role: profile.role,
      tenantId: profile.tenantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
    },
  }
}

export async function registerTenant(req: RegisterTenantRequest): Promise<AuthResponse> {
  // 1. Create tenant row
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({
      name: req.tenantName,
      slug: req.tenantSlug,
      status: 'trial',
      plan: 'starter',
    })
    .select('id')
    .single()

  if (tenantError) {
    if (tenantError.code === '23505') throw new AppError('SLUG_TAKEN', 409, { slug: req.tenantSlug })
    throw new AppError('TENANT_CREATE_FAILED', 500)
  }

  // 2. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: req.email,
    password: req.password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    // Rollback tenant on auth failure
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
    if (authError?.message?.includes('already registered')) {
      throw new AppError('EMAIL_TAKEN', 409)
    }
    throw new AppError('USER_CREATE_FAILED', 500)
  }

  // 3. Create user profile row
  const { error: profileError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    tenant_id: tenant.id,
    role: UserRole.TENANT_ADMIN,
    first_name: req.firstName,
    last_name: req.lastName,
    phone: req.phone ?? null,
  })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
    throw new AppError('PROFILE_CREATE_FAILED', 500)
  }

  // 4. Sign in to get session tokens
  const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
    email: req.email,
    password: req.password,
  })

  if (sessionError || !session.session) throw new AppError('SESSION_CREATE_FAILED', 500)

  return {
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
    expiresIn: session.session.expires_in,
    user: {
      id: authData.user.id,
      email: req.email,
      role: UserRole.TENANT_ADMIN,
      tenantId: tenant.id,
      firstName: req.firstName,
      lastName: req.lastName,
    },
  }
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: token })

  if (error || !data.session || !data.user) {
    throw new AppError('INVALID_REFRESH_TOKEN', 401)
  }

  const profile = await fetchUserProfile(data.user.id)

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      role: profile.role,
      tenantId: profile.tenantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
    },
  }
}

export async function logout(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.signOut(userId)
  if (error) throw new AppError('LOGOUT_FAILED', 500)
}
