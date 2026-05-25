import type { RequestHandler } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../lib/errors.js'
import type { AuthRequest } from '../types/express.js'

export const tenantMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const authReq = req as AuthRequest
    const { tenantId } = authReq.user

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, status, plan, settings')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) throw new AppError('TENANT_NOT_FOUND', 404)

    if (tenant.status === 'suspended') {
      throw new AppError('TENANT_SUSPENDED', 403, { tenantId })
    }

    await supabaseAdmin.rpc('set_tenant_context', { p_tenant_id: tenantId })

    authReq.tenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.plan,
      settings: (tenant.settings as Record<string, unknown>) ?? {},
    }

    next()
  } catch (err) {
    next(err)
  }
}
