import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import type { Database } from '../../types/supabase.types.js'
import type { ProductCategory } from '@panisewa/shared'
import type { CreateProductInput, UpdateProductInput } from '@panisewa/shared'
import type { IProduct } from './product.types.js'

type ProductUpdate = Database['public']['Tables']['products']['Update']

const STORAGE_BUCKET = 'product-images'

function toProduct(row: Record<string, unknown>): IProduct {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    nameEn: row['name_en'] as string,
    nameNe: row['name_ne'] as string,
    sku: row['sku'] as string | null,
    category: row['category'] as ProductCategory | null,
    priceB2c: row['price_b2c'] as number,
    priceB2b: row['price_b2b'] as number,
    depositAmount: row['deposit_amount'] as number,
    reorderLevel: row['reorder_level'] as number,
    isActive: row['is_active'] as boolean,
    imageUrl: row['image_url'] as string | null,
    createdAt: row['created_at'] as string,
  }
}

export async function createProduct(tenantId: string, input: CreateProductInput): Promise<IProduct> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      tenant_id: tenantId,
      name_en: input.name_en,
      name_ne: input.name_ne,
      sku: input.sku ?? null,
      category: input.category ?? null,
      price_b2c: input.price_b2c,
      price_b2b: input.price_b2b,
      deposit_amount: input.deposit_amount,
      reorder_level: input.reorder_level,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new AppError('SKU_ALREADY_EXISTS', 409, { sku: input.sku })
    throw new AppError('PRODUCT_CREATE_FAILED', 500)
  }

  return toProduct(data as Record<string, unknown>)
}

export async function getProducts(
  tenantId: string,
  opts: { activeOnly?: boolean } = {}
): Promise<IProduct[]> {
  let query = supabaseAdmin
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (opts.activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw new AppError('PRODUCTS_FETCH_FAILED', 500)

  return (data as Record<string, unknown>[]).map(toProduct)
}

export async function getProductById(tenantId: string, productId: string): Promise<IProduct> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) throw new AppError('PRODUCT_NOT_FOUND', 404, { productId })

  return toProduct(data as Record<string, unknown>)
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  input: UpdateProductInput
): Promise<IProduct> {
  const update: ProductUpdate = {}
  if (input.name_en !== undefined) update['name_en'] = input.name_en
  if (input.name_ne !== undefined) update['name_ne'] = input.name_ne
  if (input.sku !== undefined) update['sku'] = input.sku
  if (input.category !== undefined) update['category'] = input.category
  if (input.price_b2c !== undefined) update['price_b2c'] = input.price_b2c
  if (input.price_b2b !== undefined) update['price_b2b'] = input.price_b2b
  if (input.deposit_amount !== undefined) update['deposit_amount'] = input.deposit_amount
  if (input.reorder_level !== undefined) update['reorder_level'] = input.reorder_level
  if (input.is_active !== undefined) update['is_active'] = input.is_active

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(update)
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('PRODUCT_NOT_FOUND', 404, { productId })

  return toProduct(data as Record<string, unknown>)
}

export async function deleteProduct(tenantId: string, productId: string): Promise<void> {
  // Soft delete
  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_active: false })
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) throw new AppError('PRODUCT_NOT_FOUND', 404, { productId })
}

export async function uploadProductImage(
  tenantId: string,
  productId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split('/')[1] ?? 'jpg'
  const path = `${tenantId}/${productId}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true })

  if (error) throw new AppError('IMAGE_UPLOAD_FAILED', 500, { error: error.message })

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path)

  await supabaseAdmin
    .from('products')
    .update({ image_url: data.publicUrl })
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  return data.publicUrl
}
