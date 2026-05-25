import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/supabase.js', () => {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'select', 'insert', 'update', 'eq', 'or', 'order', 'range', 'single']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return { supabaseAdmin: chain }
})

import { supabaseAdmin } from '../../lib/supabase.js'
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomers,
} from './customer.service.js'

const db = supabaseAdmin as unknown as Record<string, ReturnType<typeof vi.fn>>
const tenantId = 'tenant-1'
const customerId = 'cust-1'

const mockRow = {
  id: customerId,
  tenant_id: tenantId,
  user_id: null,
  type: 'B2C',
  name: 'Ram Bahadur',
  phone: '9812345678',
  email: null,
  address: null,
  credit_limit: 0,
  credit_terms: null,
  notes: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

function resetChain() {
  const methods = ['from', 'select', 'insert', 'update', 'eq', 'or', 'order', 'range']
  for (const m of methods) {
    db[m]!.mockReturnValue(db)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetChain()
})

describe('createCustomer', () => {
  it('returns customer on success', async () => {
    db['single']!.mockResolvedValue({ data: mockRow, error: null })

    const result = await createCustomer(tenantId, {
      type: 'B2C' as never,
      name: 'Ram Bahadur',
      phone: '9812345678',
      credit_limit: 0,
    })

    expect(result.id).toBe(customerId)
    expect(result.name).toBe('Ram Bahadur')
    expect(result.type).toBe('B2C')
  })

  it('throws CUSTOMER_CREATE_FAILED on error', async () => {
    db['single']!.mockResolvedValue({ data: null, error: { message: 'db error' } })

    await expect(
      createCustomer(tenantId, { type: 'B2C' as never, name: 'x', credit_limit: 0 })
    ).rejects.toMatchObject({ code: 'CUSTOMER_CREATE_FAILED' })
  })
})

describe('getCustomerById', () => {
  it('returns customer', async () => {
    db['single']!.mockResolvedValue({ data: mockRow, error: null })
    const result = await getCustomerById(tenantId, customerId)
    expect(result.id).toBe(customerId)
  })

  it('throws CUSTOMER_NOT_FOUND when missing', async () => {
    db['single']!.mockResolvedValue({ data: null, error: null })
    await expect(getCustomerById(tenantId, customerId)).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    })
  })
})

describe('getCustomers', () => {
  it('returns paginated customers', async () => {
    db['range']!.mockResolvedValue({ data: [mockRow], error: null, count: 1 })
    const result = await getCustomers(tenantId, { page: 1, limit: 20 })
    expect(result.customers).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('throws CUSTOMERS_FETCH_FAILED on error', async () => {
    db['range']!.mockResolvedValue({ data: null, error: { message: 'db error' }, count: null })
    await expect(getCustomers(tenantId, { page: 1, limit: 20 })).rejects.toMatchObject({
      code: 'CUSTOMERS_FETCH_FAILED',
    })
  })
})

describe('updateCustomer', () => {
  it('returns updated customer', async () => {
    const updated = { ...mockRow, name: 'Updated Name' }
    db['single']!.mockResolvedValue({ data: updated, error: null })
    const result = await updateCustomer(tenantId, customerId, { name: 'Updated Name' })
    expect(result.name).toBe('Updated Name')
  })

  it('throws CUSTOMER_NOT_FOUND on error', async () => {
    db['single']!.mockResolvedValue({ data: null, error: { message: 'not found' } })
    await expect(updateCustomer(tenantId, customerId, {})).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    })
  })
})

describe('deleteCustomer', () => {
  it('resolves without throwing', async () => {
    db['eq']!.mockReturnValueOnce(db).mockResolvedValueOnce({ error: null })
    await expect(deleteCustomer(tenantId, customerId)).resolves.toBeUndefined()
  })

  it('throws CUSTOMER_NOT_FOUND on error', async () => {
    db['eq']!.mockReturnValueOnce(db).mockResolvedValueOnce({ error: { message: 'not found' } })
    await expect(deleteCustomer(tenantId, customerId)).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    })
  })
})
