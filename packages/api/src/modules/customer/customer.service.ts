import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import type { CustomerType } from '@panisewa/shared'
import type { CreateCustomerInput, UpdateCustomerInput, CustomerFilterInput } from '@panisewa/shared'
import type { ICustomer } from './customer.types.js'
import type { Database } from '../../types/supabase.types.js'

type CustomerUpdate = Database['public']['Tables']['customers']['Update']

function toCustomer(row: Record<string, unknown>): ICustomer {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    userId: row['user_id'] as string | null,
    type: row['type'] as CustomerType,
    name: row['name'] as string,
    phone: row['phone'] as string | null,
    email: row['email'] as string | null,
    address: row['address'] as Record<string, unknown> | null,
    creditLimit: row['credit_limit'] as number,
    creditTerms: row['credit_terms'] as 'net30' | 'net60' | 'net90' | null,
    notes: row['notes'] as string | null,
    isActive: row['is_active'] as boolean,
    createdAt: row['created_at'] as string,
  }
}

export async function createCustomer(
  tenantId: string,
  input: CreateCustomerInput
): Promise<ICustomer> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({
      tenant_id: tenantId,
      type: input.type,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      credit_limit: input.credit_limit,
      credit_terms: input.credit_terms ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single()

  if (error || !data) throw new AppError('CUSTOMER_CREATE_FAILED', 500)
  return toCustomer(data as Record<string, unknown>)
}

export async function getCustomers(
  tenantId: string,
  filters: CustomerFilterInput
): Promise<{ customers: ICustomer[]; total: number }> {
  const { type, search, is_active, page, limit } = filters
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('type', type)
  if (is_active !== undefined) query = query.eq('is_active', is_active)
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw new AppError('CUSTOMERS_FETCH_FAILED', 500)

  return {
    customers: (data as Record<string, unknown>[]).map(toCustomer),
    total: count ?? 0,
  }
}

export async function getCustomerById(tenantId: string, customerId: string): Promise<ICustomer> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) throw new AppError('CUSTOMER_NOT_FOUND', 404, { customerId })
  return toCustomer(data as Record<string, unknown>)
}

export async function updateCustomer(
  tenantId: string,
  customerId: string,
  input: UpdateCustomerInput
): Promise<ICustomer> {
  const update: CustomerUpdate = {}
  if (input.type !== undefined) update.type = input.type
  if (input.name !== undefined) update.name = input.name
  if (input.phone !== undefined) update.phone = input.phone ?? null
  if (input.email !== undefined) update.email = input.email ?? null
  if (input.address !== undefined) update.address = input.address ?? null
  if (input.credit_limit !== undefined) update.credit_limit = input.credit_limit
  if (input.credit_terms !== undefined) update.credit_terms = input.credit_terms ?? null
  if (input.notes !== undefined) update.notes = input.notes ?? null
  if (input.is_active !== undefined) update.is_active = input.is_active

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update(update)
    .eq('id', customerId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('CUSTOMER_NOT_FOUND', 404, { customerId })
  return toCustomer(data as Record<string, unknown>)
}

export async function deleteCustomer(tenantId: string, customerId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('customers')
    .update({ is_active: false })
    .eq('id', customerId)
    .eq('tenant_id', tenantId)

  if (error) throw new AppError('CUSTOMER_NOT_FOUND', 404, { customerId })
}
