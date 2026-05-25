import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { PLAN_LIMITS } from '@panisewa/shared'
import type { ITenant, TenantSettings, TenantUsageStats } from './tenant.types.js'

export async function getTenant(tenantId: string): Promise<ITenant> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error || !data) throw new AppError('TENANT_NOT_FOUND', 404, { tenantId })

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logoUrl: data.logo_url,
    status: data.status as ITenant['status'],
    plan: data.plan as ITenant['plan'],
    settings: (data.settings as TenantSettings) ?? {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateSettings(tenantId: string, settings: TenantSettings): Promise<ITenant> {
  // Merge with existing settings (patch semantics)
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  if (fetchError || !existing) throw new AppError('TENANT_NOT_FOUND', 404)

  const merged = { ...(existing.settings as TenantSettings), ...settings }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .update({ settings: merged })
    .eq('id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('SETTINGS_UPDATE_FAILED', 500)

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logoUrl: data.logo_url,
    status: data.status as ITenant['status'],
    plan: data.plan as ITenant['plan'],
    settings: merged,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function getUsageStats(tenantId: string, plan: string): Promise<TenantUsageStats> {
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  if (error) throw new AppError('USAGE_FETCH_FAILED', 500)

  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.starter

  return {
    userCount: count ?? 0,
    planLimits: {
      users: limits.users === Infinity ? -1 : limits.users,
      storageGb: limits.storageGb,
    },
  }
}
