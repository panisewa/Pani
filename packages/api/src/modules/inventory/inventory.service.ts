import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { InventoryLedgerType } from '@panisewa/shared'
import type { LedgerFilterInput } from '@panisewa/shared'
import type { IInventoryLedger, IStockLevel } from './inventory.types.js'

function toLedger(row: Record<string, unknown>): IInventoryLedger {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    productId: row['product_id'] as string,
    type: row['type'] as InventoryLedgerType,
    quantity: row['quantity'] as number,
    balanceBefore: row['balance_before'] as number,
    balanceAfter: row['balance_after'] as number,
    referenceId: row['reference_id'] as string | null,
    referenceType: row['reference_type'] as 'order' | 'purchase_order' | 'manual' | null,
    note: row['note'] as string | null,
    createdBy: row['created_by'] as string | null,
    createdAt: row['created_at'] as string,
  }
}

async function getCurrentStockForProduct(tenantId: string, productId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('inventory_ledger')
    .select('balance_after')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return 0
  return (data as Record<string, unknown>)['balance_after'] as number
}

export async function addStock(
  tenantId: string,
  productId: string,
  quantity: number,
  note: string | null,
  createdBy: string | null,
  referenceId: string | null = null,
  referenceType: 'order' | 'purchase_order' | 'manual' | null = 'manual'
): Promise<IInventoryLedger> {
  if (quantity <= 0) throw new AppError('INVALID_QUANTITY', 400)

  const balanceBefore = await getCurrentStockForProduct(tenantId, productId)
  const balanceAfter = balanceBefore + quantity

  const { data, error } = await supabaseAdmin
    .from('inventory_ledger')
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      type: InventoryLedgerType.IN,
      quantity,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_id: referenceId,
      reference_type: referenceType,
      note,
      created_by: createdBy,
    })
    .select('*')
    .single()

  if (error || !data) throw new AppError('STOCK_ADD_FAILED', 500)
  return toLedger(data as Record<string, unknown>)
}

export async function deductStock(
  tenantId: string,
  productId: string,
  quantity: number,
  note: string | null,
  createdBy: string | null,
  referenceId: string | null = null,
  referenceType: 'order' | 'purchase_order' | 'manual' | null = 'manual'
): Promise<IInventoryLedger> {
  if (quantity <= 0) throw new AppError('INVALID_QUANTITY', 400)

  const balanceBefore = await getCurrentStockForProduct(tenantId, productId)
  if (balanceBefore < quantity) throw new AppError('INSUFFICIENT_STOCK', 409)

  const balanceAfter = balanceBefore - quantity

  const { data, error } = await supabaseAdmin
    .from('inventory_ledger')
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      type: InventoryLedgerType.OUT,
      quantity,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_id: referenceId,
      reference_type: referenceType,
      note,
      created_by: createdBy,
    })
    .select('*')
    .single()

  if (error || !data) throw new AppError('STOCK_DEDUCT_FAILED', 500)
  return toLedger(data as Record<string, unknown>)
}

export async function adjustStock(
  tenantId: string,
  productId: string,
  quantity: number,
  note: string | null,
  createdBy: string | null
): Promise<IInventoryLedger> {
  if (quantity === 0) throw new AppError('INVALID_QUANTITY', 400)

  const balanceBefore = await getCurrentStockForProduct(tenantId, productId)
  const balanceAfter = balanceBefore + quantity
  if (balanceAfter < 0) throw new AppError('INSUFFICIENT_STOCK', 409)

  const { data, error } = await supabaseAdmin
    .from('inventory_ledger')
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      type: InventoryLedgerType.ADJUSTMENT,
      quantity,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_id: null,
      reference_type: 'manual',
      note,
      created_by: createdBy,
    })
    .select('*')
    .single()

  if (error || !data) throw new AppError('STOCK_ADJUST_FAILED', 500)
  return toLedger(data as Record<string, unknown>)
}

export async function getCurrentStock(tenantId: string, productId: string): Promise<IStockLevel> {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('reorder_level')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !product) throw new AppError('PRODUCT_NOT_FOUND', 404, { productId })

  const currentStock = await getCurrentStockForProduct(tenantId, productId)
  const reorderLevel = (product as Record<string, unknown>)['reorder_level'] as number

  return {
    productId,
    currentStock,
    reorderLevel,
    isLow: currentStock <= reorderLevel,
  }
}

export async function getCurrentStockAll(tenantId: string): Promise<IStockLevel[]> {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, reorder_level')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  if (error) throw new AppError('PRODUCTS_FETCH_FAILED', 500)
  if (!products || products.length === 0) return []

  const levels = await Promise.all(
    (products as Record<string, unknown>[]).map(async (p) => {
      const productId = p['id'] as string
      const reorderLevel = p['reorder_level'] as number
      const currentStock = await getCurrentStockForProduct(tenantId, productId)
      return { productId, currentStock, reorderLevel, isLow: currentStock <= reorderLevel }
    })
  )

  return levels
}

export async function getLedger(
  tenantId: string,
  filters: LedgerFilterInput
): Promise<{ entries: IInventoryLedger[]; total: number }> {
  const { product_id, type, from, to, page, limit } = filters
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('inventory_ledger')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (product_id) query = query.eq('product_id', product_id)
  if (type) query = query.eq('type', type)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error, count } = await query
  if (error) throw new AppError('LEDGER_FETCH_FAILED', 500)

  return {
    entries: (data as Record<string, unknown>[]).map(toLedger),
    total: count ?? 0,
  }
}

export async function getLowStockItems(tenantId: string): Promise<IStockLevel[]> {
  const all = await getCurrentStockAll(tenantId)
  return all.filter((s) => s.isLow)
}
