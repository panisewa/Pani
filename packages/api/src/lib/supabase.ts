import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase.types.js'

const url = process.env['SUPABASE_URL']
const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
const anonKey = process.env['SUPABASE_ANON_KEY']

if (!url || !serviceKey || !anonKey) {
  throw new Error('Missing Supabase env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY')
}

/** Service role client — bypasses RLS. Server-only. Never expose to client. */
export const supabaseAdmin = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false },
})

/** Anon client — RLS enforced. Use after calling set_tenant_context. */
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: false },
})
