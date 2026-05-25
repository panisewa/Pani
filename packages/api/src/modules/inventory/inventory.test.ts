import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/supabase.js', () => {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'select', 'insert', 'update', 'eq', 'order', 'limit', 'range', 'gte', 'lte', 'single']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return { supabaseAdmin: chain }
})

import { supabaseAdmin } from '../../lib/supabase.js'
import { adjustStock, getCurrentStock, getLedger, getLowStockItems } from './inventory.service.js'

const tenantId = 'tenant-111'
const productId = 'prod-222'
const userId = 'user-333'

const db = supabaseAdmin as unknown as Record<string, ReturnType<typeof vi.fn>>

function resetChain() {
  const methods = ['from', 'select', 'insert', 'update', 'eq', 'order', 'limit', 'range', 'gte', 'lte']
  for (const m of methods) {
    db[m]!.mockReturnValue(db)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetChain()
})

describe('adjustStock', () => {
  it('inserts ADJUSTMENT ledger entry', async () => {
    const ledgerRow = {
      id: 'led-1',
      tenant_id: tenantId,
      product_id: productId,
      type: 'ADJUSTMENT',
      quantity: 5,
      balance_before: 10,
      balance_after: 15,
      reference_id: null,
      reference_type: 'manual',
      note: 'recount',
      created_by: userId,
      created_at: '2026-01-01T00:00:00Z',
    }

    // getCurrentStockForProduct call → single returns last ledger row
    db['single']!
      .mockResolvedValueOnce({ data: { balance_after: 10 }, error: null }) // stock lookup
      .mockResolvedValueOnce({ data: ledgerRow, error: null }) // insert

    const result = await adjustStock(tenantId, productId, 5, 'recount', userId)
    expect(result.type).toBe('ADJUSTMENT')
    expect(result.balanceAfter).toBe(15)
  })

  it('throws INVALID_QUANTITY for 0', async () => {
    await expect(adjustStock(tenantId, productId, 0, null, null)).rejects.toMatchObject({
      code: 'INVALID_QUANTITY',
    })
  })

  it('throws INSUFFICIENT_STOCK when deduct exceeds balance', async () => {
    db['single']!.mockResolvedValueOnce({ data: { balance_after: 3 }, error: null })

    await expect(adjustStock(tenantId, productId, -10, null, null)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
    })
  })
})

describe('getCurrentStock', () => {
  it('returns stock level with isLow flag', async () => {
    db['single']!
      .mockResolvedValueOnce({ data: { reorder_level: 10 }, error: null }) // products query
      .mockResolvedValueOnce({ data: { balance_after: 5 }, error: null }) // ledger query

    const result = await getCurrentStock(tenantId, productId)
    expect(result.currentStock).toBe(5)
    expect(result.reorderLevel).toBe(10)
    expect(result.isLow).toBe(true)
  })

  it('returns 0 stock when no ledger entries', async () => {
    db['single']!
      .mockResolvedValueOnce({ data: { reorder_level: 10 }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const result = await getCurrentStock(tenantId, productId)
    expect(result.currentStock).toBe(0)
  })

  it('throws PRODUCT_NOT_FOUND when product missing', async () => {
    db['single']!.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    await expect(getCurrentStock(tenantId, productId)).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    })
  })
})

describe('getLedger', () => {
  it('returns paginated ledger entries', async () => {
    const ledgerRow = {
      id: 'led-1',
      tenant_id: tenantId,
      product_id: productId,
      type: 'IN',
      quantity: 20,
      balance_before: 0,
      balance_after: 20,
      reference_id: null,
      reference_type: null,
      note: null,
      created_by: null,
      created_at: '2026-01-01T00:00:00Z',
    }

    db['range']!.mockResolvedValueOnce({ data: [ledgerRow], error: null, count: 1 })

    const result = await getLedger(tenantId, { page: 1, limit: 20 })
    expect(result.entries).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.entries[0]!.type).toBe('IN')
  })

  it('throws LEDGER_FETCH_FAILED on error', async () => {
    db['range']!.mockResolvedValueOnce({ data: null, error: { message: 'db error' }, count: null })

    await expect(getLedger(tenantId, { page: 1, limit: 20 })).rejects.toMatchObject({
      code: 'LEDGER_FETCH_FAILED',
    })
  })
})

describe('getLowStockItems', () => {
  it('returns only low stock items', async () => {
    // getCurrentStockAll: .eq('tenant_id') → db, .eq('is_active') → resolves products
    db['eq']!
      .mockReturnValueOnce(db)
      .mockResolvedValueOnce({
        data: [
          { id: 'p1', reorder_level: 10 },
          { id: 'p2', reorder_level: 5 },
        ],
        error: null,
      })

    // getCurrentStockForProduct for p1 then p2 — each ends at .single()
    db['single']!
      .mockResolvedValueOnce({ data: { balance_after: 3 }, error: null }) // p1: stock=3, low
      .mockResolvedValueOnce({ data: { balance_after: 8 }, error: null }) // p2: stock=8, ok

    const result = await getLowStockItems(tenantId)
    expect(result).toHaveLength(1)
    expect(result[0]!.productId).toBe('p1')
  })
})
