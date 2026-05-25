import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderStatus } from '@panisewa/shared'

// Per-table chains so order_items.eq doesn't collide with orders.eq
type Chain = Record<string, ReturnType<typeof vi.fn>>

function makeChain(): Chain {
  const c: Chain = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'in', 'order', 'range', 'single', 'gte', 'lte']) {
    c[m] = vi.fn().mockReturnValue(c)
  }
  return c
}

const chains: Record<string, Chain> = {
  orders: makeChain(),
  order_items: makeChain(),
  users: makeChain(),
}

vi.mock('../../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: 1, error: null }),
  },
}))

vi.mock('../inventory/inventory.service.js', () => ({
  deductStock: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../lib/bullmq/queues.js', () => ({
  pdfQueue: { add: vi.fn().mockResolvedValue({}) },
  notificationQueue: { add: vi.fn().mockResolvedValue({}) },
}))

import { supabaseAdmin } from '../../lib/supabase.js'
import { deductStock } from '../inventory/inventory.service.js'
import {
  confirmOrder,
  assignDriver,
  markOutForDelivery,
  confirmDelivery,
  cancelOrder,
  markFailed,
  getOrderById,
} from './order.service.js'
import { ORDER_TRANSITIONS } from './order.types.js'

const tenantId = 'tenant-1'
const orderId = 'order-1'
const driverId = 'driver-1'

function makeOrderRow(status: OrderStatus, extra: Record<string, unknown> = {}) {
  return {
    id: orderId,
    tenant_id: tenantId,
    order_number: 'ORD-20260101-00001',
    customer_id: 'cust-1',
    type: 'B2C',
    status,
    assigned_driver_id: null,
    scheduled_date: null,
    delivery_address: null,
    payment_method: null,
    payment_status: 'PENDING',
    subtotal: 8000,
    vat_amount: 1040,
    total: 9040,
    empties_collected: 0,
    delivery_photo_url: null,
    notes: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...extra,
  }
}

beforeEach(() => {
  vi.clearAllMocks()

  ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    return chains[table] ?? makeChain()
  })

  // Reset all chains to return themselves (chainable)
  for (const chain of Object.values(chains)) {
    for (const m of ['select', 'insert', 'update', 'eq', 'in', 'order', 'range', 'gte', 'lte', 'single']) {
      chain[m]!.mockReturnValue(chain)
    }
  }

  // order_items query ends at .eq('order_id') → resolve with empty items by default
  chains['order_items']!['eq']!.mockResolvedValue({ data: [], error: null })
})

// Queue an order fetch result on ordersChain.single
function mockGetOrder(status: OrderStatus) {
  chains['orders']!['single']!.mockResolvedValueOnce({ data: makeOrderRow(status), error: null })
}

// Queue an update/transition result on ordersChain.single
function mockTransition(newStatus: OrderStatus, extra: Record<string, unknown> = {}) {
  chains['orders']!['single']!.mockResolvedValueOnce({
    data: makeOrderRow(newStatus, extra),
    error: null,
  })
}

// ─── ORDER_TRANSITIONS map ────────────────────────────────────────────────────

describe('ORDER_TRANSITIONS map', () => {
  it('DRAFT allows CONFIRMED and CANCELLED', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.DRAFT]).toContain(OrderStatus.CONFIRMED)
    expect(ORDER_TRANSITIONS[OrderStatus.DRAFT]).toContain(OrderStatus.CANCELLED)
  })
  it('CONFIRMED allows ASSIGNED and CANCELLED', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.CONFIRMED]).toContain(OrderStatus.ASSIGNED)
    expect(ORDER_TRANSITIONS[OrderStatus.CONFIRMED]).toContain(OrderStatus.CANCELLED)
  })
  it('ASSIGNED allows only OUT_FOR_DELIVERY', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.ASSIGNED]).toEqual([OrderStatus.OUT_FOR_DELIVERY])
  })
  it('OUT_FOR_DELIVERY allows DELIVERED and FAILED', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.OUT_FOR_DELIVERY]).toContain(OrderStatus.DELIVERED)
    expect(ORDER_TRANSITIONS[OrderStatus.OUT_FOR_DELIVERY]).toContain(OrderStatus.FAILED)
  })
  it('DELIVERED is terminal', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.DELIVERED]).toHaveLength(0)
  })
  it('FAILED is terminal', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.FAILED]).toHaveLength(0)
  })
  it('CANCELLED is terminal', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.CANCELLED]).toHaveLength(0)
  })
})

// ─── confirmOrder ─────────────────────────────────────────────────────────────

describe('confirmOrder', () => {
  it('DRAFT → CONFIRMED succeeds', async () => {
    mockGetOrder(OrderStatus.DRAFT)
    mockTransition(OrderStatus.CONFIRMED)
    const result = await confirmOrder(tenantId, orderId)
    expect(result.status).toBe(OrderStatus.CONFIRMED)
  })

  it('CONFIRMED → CONFIRMED throws INVALID_ORDER_TRANSITION', async () => {
    mockGetOrder(OrderStatus.CONFIRMED)
    await expect(confirmOrder(tenantId, orderId)).rejects.toMatchObject({
      code: 'INVALID_ORDER_TRANSITION',
    })
  })

  it('DELIVERED → CONFIRMED throws INVALID_ORDER_TRANSITION', async () => {
    mockGetOrder(OrderStatus.DELIVERED)
    await expect(confirmOrder(tenantId, orderId)).rejects.toMatchObject({
      code: 'INVALID_ORDER_TRANSITION',
    })
  })
})

// ─── assignDriver ─────────────────────────────────────────────────────────────

describe('assignDriver', () => {
  it('CONFIRMED → ASSIGNED succeeds', async () => {
    // driver lookup runs first in assignDriver, then transitionStatus → getOrderById
    chains['users']!['single']!.mockResolvedValueOnce({
      data: { id: driverId, role: 'DRIVER' },
      error: null,
    })
    mockGetOrder(OrderStatus.CONFIRMED)
    mockTransition(OrderStatus.ASSIGNED, { assigned_driver_id: driverId })

    const result = await assignDriver(tenantId, orderId, driverId)
    expect(result.status).toBe(OrderStatus.ASSIGNED)
  })

  it('throws DRIVER_NOT_FOUND when driver missing', async () => {
    chains['users']!['single']!.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    await expect(assignDriver(tenantId, orderId, driverId)).rejects.toMatchObject({
      code: 'DRIVER_NOT_FOUND',
    })
  })

  it('throws USER_NOT_A_DRIVER when role is wrong', async () => {
    chains['users']!['single']!.mockResolvedValueOnce({
      data: { id: driverId, role: 'MANAGER' },
      error: null,
    })
    await expect(assignDriver(tenantId, orderId, driverId)).rejects.toMatchObject({
      code: 'USER_NOT_A_DRIVER',
    })
  })

  it('DRAFT → ASSIGNED throws INVALID_ORDER_TRANSITION', async () => {
    chains['users']!['single']!.mockResolvedValueOnce({
      data: { id: driverId, role: 'DRIVER' },
      error: null,
    })
    mockGetOrder(OrderStatus.DRAFT)
    await expect(assignDriver(tenantId, orderId, driverId)).rejects.toMatchObject({
      code: 'INVALID_ORDER_TRANSITION',
    })
  })
})

// ─── markOutForDelivery ───────────────────────────────────────────────────────

describe('markOutForDelivery', () => {
  it('ASSIGNED → OUT_FOR_DELIVERY succeeds', async () => {
    mockGetOrder(OrderStatus.ASSIGNED)
    mockTransition(OrderStatus.OUT_FOR_DELIVERY)
    const result = await markOutForDelivery(tenantId, orderId)
    expect(result.status).toBe(OrderStatus.OUT_FOR_DELIVERY)
  })

  it('DRAFT → OUT_FOR_DELIVERY throws INVALID_ORDER_TRANSITION', async () => {
    mockGetOrder(OrderStatus.DRAFT)
    await expect(markOutForDelivery(tenantId, orderId)).rejects.toMatchObject({
      code: 'INVALID_ORDER_TRANSITION',
    })
  })
})

// ─── confirmDelivery ──────────────────────────────────────────────────────────

describe('confirmDelivery', () => {
  it('OUT_FOR_DELIVERY → DELIVERED deducts stock and queues jobs', async () => {
    const itemRow = {
      id: 'item-1',
      order_id: orderId,
      tenant_id: tenantId,
      product_id: 'prod-1',
      quantity: 2,
      unit_price: 4000,
      deposit_amount: 0,
      subtotal: 8000,
    }
    chains['order_items']!['eq']!.mockResolvedValueOnce({ data: [itemRow], error: null })
    mockGetOrder(OrderStatus.OUT_FOR_DELIVERY)
    mockTransition(OrderStatus.DELIVERED, { empties_collected: 1 })

    const result = await confirmDelivery(tenantId, orderId, { empties_collected: 1 })

    expect(result.status).toBe(OrderStatus.DELIVERED)
    expect(deductStock).toHaveBeenCalledTimes(1)
  })

  it('ASSIGNED → DELIVERED throws INVALID_ORDER_TRANSITION', async () => {
    mockGetOrder(OrderStatus.ASSIGNED)
    await expect(
      confirmDelivery(tenantId, orderId, { empties_collected: 0 })
    ).rejects.toMatchObject({ code: 'INVALID_ORDER_TRANSITION' })
  })
})

// ─── cancelOrder ─────────────────────────────────────────────────────────────

describe('cancelOrder', () => {
  it('DRAFT → CANCELLED succeeds', async () => {
    mockGetOrder(OrderStatus.DRAFT)
    mockTransition(OrderStatus.CANCELLED)
    const result = await cancelOrder(tenantId, orderId, 'customer request')
    expect(result.status).toBe(OrderStatus.CANCELLED)
  })

  it('CONFIRMED → CANCELLED succeeds', async () => {
    mockGetOrder(OrderStatus.CONFIRMED)
    mockTransition(OrderStatus.CANCELLED)
    const result = await cancelOrder(tenantId, orderId, null)
    expect(result.status).toBe(OrderStatus.CANCELLED)
  })

  it('ASSIGNED → CANCELLED throws INVALID_ORDER_TRANSITION', async () => {
    mockGetOrder(OrderStatus.ASSIGNED)
    await expect(cancelOrder(tenantId, orderId, null)).rejects.toMatchObject({
      code: 'INVALID_ORDER_TRANSITION',
    })
  })

  it('DELIVERED → CANCELLED throws INVALID_ORDER_TRANSITION', async () => {
    mockGetOrder(OrderStatus.DELIVERED)
    await expect(cancelOrder(tenantId, orderId, null)).rejects.toMatchObject({
      code: 'INVALID_ORDER_TRANSITION',
    })
  })
})

// ─── markFailed ───────────────────────────────────────────────────────────────

describe('markFailed', () => {
  it('OUT_FOR_DELIVERY → FAILED succeeds', async () => {
    mockGetOrder(OrderStatus.OUT_FOR_DELIVERY)
    mockTransition(OrderStatus.FAILED)
    const result = await markFailed(tenantId, orderId)
    expect(result.status).toBe(OrderStatus.FAILED)
  })

  it('DELIVERED → FAILED throws INVALID_ORDER_TRANSITION', async () => {
    mockGetOrder(OrderStatus.DELIVERED)
    await expect(markFailed(tenantId, orderId)).rejects.toMatchObject({
      code: 'INVALID_ORDER_TRANSITION',
    })
  })
})

// ─── getOrderById ─────────────────────────────────────────────────────────────

describe('getOrderById', () => {
  it('returns order with items', async () => {
    mockGetOrder(OrderStatus.DRAFT)
    const result = await getOrderById(tenantId, orderId)
    expect(result.id).toBe(orderId)
    expect(result.items).toEqual([])
  })

  it('throws ORDER_NOT_FOUND when missing', async () => {
    chains['orders']!['single']!.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    })
    await expect(getOrderById(tenantId, orderId)).rejects.toMatchObject({
      code: 'ORDER_NOT_FOUND',
    })
  })
})
