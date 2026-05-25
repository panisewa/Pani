import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../lib/errors.js'

vi.mock('../../lib/supabase.js', () => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      }),
    },
  }
  return { supabaseAdmin: chain }
})

import { supabaseAdmin } from '../../lib/supabase.js'
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from './product.service.js'

const tenantId = 'tenant-111'
const productId = 'prod-222'

const mockRow = {
  id: productId,
  tenant_id: tenantId,
  name_en: 'Water Jar 20L',
  name_ne: 'पानी जार २०लि',
  sku: 'JAR-20L',
  category: 'JAR_20L',
  price_b2c: 8000,
  price_b2b: 6000,
  deposit_amount: 20000,
  reorder_level: 10,
  is_active: true,
  image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const db = supabaseAdmin as unknown as Record<string, ReturnType<typeof vi.fn>>

beforeEach(() => {
  vi.clearAllMocks()
  ;(db['from'] as ReturnType<typeof vi.fn>).mockReturnValue(db)
  ;(db['insert'] as ReturnType<typeof vi.fn>).mockReturnValue(db)
  ;(db['select'] as ReturnType<typeof vi.fn>).mockReturnValue(db)
  ;(db['update'] as ReturnType<typeof vi.fn>).mockReturnValue(db)
  ;(db['eq'] as ReturnType<typeof vi.fn>).mockReturnValue(db)
  ;(db['order'] as ReturnType<typeof vi.fn>).mockReturnValue(db)
})

describe('createProduct', () => {
  it('returns product on success', async () => {
    ;(db['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockRow, error: null })

    const result = await createProduct(tenantId, {
      name_en: 'Water Jar 20L',
      name_ne: 'पानी जार २०लि',
      sku: 'JAR-20L',
      category: 'JAR_20L' as never,
      price_b2c: 8000,
      price_b2b: 6000,
      deposit_amount: 20000,
      reorder_level: 10,
    })

    expect(result.id).toBe(productId)
    expect(result.priceB2c).toBe(8000)
    expect(result.nameEn).toBe('Water Jar 20L')
  })

  it('throws SKU_ALREADY_EXISTS on 23505', async () => {
    ;(db['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { code: '23505' },
    })

    await expect(
      createProduct(tenantId, {
        name_en: 'x',
        name_ne: 'x',
        price_b2c: 0,
        price_b2b: 0,
        deposit_amount: 0,
        reorder_level: 0,
      })
    ).rejects.toMatchObject({ code: 'SKU_ALREADY_EXISTS' })
  })

  it('throws PRODUCT_CREATE_FAILED on other error', async () => {
    ;(db['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { code: '42P01' },
    })

    await expect(
      createProduct(tenantId, {
        name_en: 'x',
        name_ne: 'x',
        price_b2c: 0,
        price_b2b: 0,
        deposit_amount: 0,
        reorder_level: 0,
      })
    ).rejects.toMatchObject({ code: 'PRODUCT_CREATE_FAILED' })
  })
})

describe('getProducts', () => {
  it('returns array of products', async () => {
    ;(db['order'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [mockRow],
      error: null,
    })

    const result = await getProducts(tenantId)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(productId)
  })

  it('throws PRODUCTS_FETCH_FAILED on error', async () => {
    ;(db['order'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'db error' },
    })

    await expect(getProducts(tenantId)).rejects.toMatchObject({ code: 'PRODUCTS_FETCH_FAILED' })
  })
})

describe('getProductById', () => {
  it('returns product', async () => {
    ;(db['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockRow, error: null })

    const result = await getProductById(tenantId, productId)
    expect(result.id).toBe(productId)
  })

  it('throws PRODUCT_NOT_FOUND when missing', async () => {
    ;(db['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null })

    await expect(getProductById(tenantId, productId)).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    })
  })
})

describe('updateProduct', () => {
  it('returns updated product', async () => {
    const updated = { ...mockRow, price_b2c: 9000 }
    ;(db['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({ data: updated, error: null })

    const result = await updateProduct(tenantId, productId, { price_b2c: 9000 })
    expect(result.priceB2c).toBe(9000)
  })

  it('throws PRODUCT_NOT_FOUND on error', async () => {
    ;(db['single'] as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    })

    await expect(updateProduct(tenantId, productId, {})).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    })
  })
})

describe('deleteProduct', () => {
  it('resolves without throwing', async () => {
    ;(db['eq'] as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(db)
      .mockResolvedValueOnce({ error: null })

    await expect(deleteProduct(tenantId, productId)).resolves.toBeUndefined()
  })

  it('throws PRODUCT_NOT_FOUND on error', async () => {
    ;(db['eq'] as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(db)
      .mockResolvedValueOnce({ error: { message: 'not found' } })

    await expect(deleteProduct(tenantId, productId)).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    })
  })
})
