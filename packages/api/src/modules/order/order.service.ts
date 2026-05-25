import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { OrderStatus, VAT_RATE } from '@panisewa/shared'
import type {
  CreateOrderInput,
  UpdateOrderInput,
  ConfirmDeliveryInput,
  OrderFilterInput,
} from '@panisewa/shared'
import type { IOrder, IOrderItem } from './order.types.js'
import { ORDER_TRANSITIONS } from './order.types.js'
import { deductStock } from '../inventory/inventory.service.js'
import { pdfQueue, notificationQueue } from '../../lib/bullmq/queues.js'
import type { Database } from '../../types/supabase.types.js'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

function toOrderItem(row: Record<string, unknown>): IOrderItem {
  return {
    id: row['id'] as string,
    orderId: row['order_id'] as string,
    tenantId: row['tenant_id'] as string,
    productId: row['product_id'] as string,
    quantity: row['quantity'] as number,
    unitPrice: row['unit_price'] as number,
    depositAmount: row['deposit_amount'] as number,
    subtotal: row['subtotal'] as number,
  }
}

function toOrder(row: Record<string, unknown>, items?: IOrderItem[]): IOrder {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    orderNumber: row['order_number'] as string,
    customerId: row['customer_id'] as string,
    type: row['type'] as IOrder['type'],
    status: row['status'] as OrderStatus,
    assignedDriverId: row['assigned_driver_id'] as string | null,
    scheduledDate: row['scheduled_date'] as string | null,
    deliveryAddress: row['delivery_address'] as Record<string, unknown> | null,
    paymentMethod: row['payment_method'] as IOrder['paymentMethod'],
    paymentStatus: row['payment_status'] as IOrder['paymentStatus'],
    subtotal: row['subtotal'] as number,
    vatAmount: row['vat_amount'] as number,
    total: row['total'] as number,
    emptiesCollected: row['empties_collected'] as number,
    deliveryPhotoUrl: row['delivery_photo_url'] as string | null,
    notes: row['notes'] as string | null,
    createdBy: row['created_by'] as string | null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
    items,
  }
}

async function generateOrderNumber(tenantId: string): Promise<string> {
  const today = new Date()
  const dateKey = today.toISOString().slice(0, 10).replace(/-/g, '')

  const { data, error } = await supabaseAdmin.rpc('increment_order_sequence', {
    p_tenant_id: tenantId,
    p_date_key: dateKey,
  })

  if (error) {
    const seq = Date.now() % 100000
    return `ORD-${dateKey}-${String(seq).padStart(5, '0')}`
  }

  return `ORD-${dateKey}-${String(data).padStart(5, '0')}`
}

export async function createOrder(
  tenantId: string,
  createdBy: string,
  input: CreateOrderInput
): Promise<IOrder> {
  const productIds = input.items.map((i) => i.product_id)
  const { data: products, error: prodError } = await supabaseAdmin
    .from('products')
    .select('id, price_b2c, price_b2b, deposit_amount')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .in('id', productIds)

  if (prodError || !products) throw new AppError('PRODUCTS_FETCH_FAILED', 500)

  const productMap = new Map(
    (products as Record<string, unknown>[]).map((p) => [p['id'] as string, p])
  )

  for (const item of input.items) {
    if (!productMap.has(item.product_id)) {
      throw new AppError('PRODUCT_NOT_FOUND', 404, { productId: item.product_id })
    }
  }

  const isB2B = input.type === 'B2B'
  let subtotal = 0
  const itemInserts: Database['public']['Tables']['order_items']['Insert'][] = []

  for (const item of input.items) {
    const p = productMap.get(item.product_id)!
    const unitPrice = isB2B ? (p['price_b2b'] as number) : (p['price_b2c'] as number)
    const deposit = p['deposit_amount'] as number
    const itemSubtotal = unitPrice * item.quantity
    subtotal += itemSubtotal + deposit * item.quantity
    itemInserts.push({
      order_id: '',
      tenant_id: tenantId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      deposit_amount: deposit,
      subtotal: itemSubtotal,
    })
  }

  const vatAmount = Math.round((subtotal * VAT_RATE) / 10000)
  const total = subtotal + vatAmount
  const orderNumber = await generateOrderNumber(tenantId)

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      tenant_id: tenantId,
      order_number: orderNumber,
      customer_id: input.customer_id,
      type: input.type,
      status: OrderStatus.DRAFT,
      scheduled_date: input.scheduled_date ?? null,
      delivery_address: input.delivery_address ?? null,
      payment_method: input.payment_method ?? null,
      subtotal,
      vat_amount: vatAmount,
      total,
      created_by: createdBy,
      notes: input.notes ?? null,
    })
    .select('*')
    .single()

  if (orderError || !order) throw new AppError('ORDER_CREATE_FAILED', 500)

  const orderId = (order as Record<string, unknown>)['id'] as string
  const itemsWithOrderId = itemInserts.map((i) => ({ ...i, order_id: orderId }))

  const { data: insertedItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(itemsWithOrderId)
    .select('*')

  if (itemsError) throw new AppError('ORDER_ITEMS_CREATE_FAILED', 500)

  return toOrder(
    order as Record<string, unknown>,
    (insertedItems as Record<string, unknown>[]).map(toOrderItem)
  )
}

export async function getOrders(
  tenantId: string,
  filters: OrderFilterInput
): Promise<{ orders: IOrder[]; total: number }> {
  const { status, type, driver_id, customer_id, from, to, page, limit } = filters
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  if (driver_id) query = query.eq('assigned_driver_id', driver_id)
  if (customer_id) query = query.eq('customer_id', customer_id)
  if (from) query = query.gte('scheduled_date', from)
  if (to) query = query.lte('scheduled_date', to)

  const { data, error, count } = await query
  if (error) throw new AppError('ORDERS_FETCH_FAILED', 500)

  return {
    orders: (data as Record<string, unknown>[]).map((r) => toOrder(r)),
    total: count ?? 0,
  }
}

export async function getOrderById(tenantId: string, orderId: string): Promise<IOrder> {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !order) throw new AppError('ORDER_NOT_FOUND', 404, { orderId })

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  return toOrder(
    order as Record<string, unknown>,
    items ? (items as Record<string, unknown>[]).map(toOrderItem) : []
  )
}

export async function updateOrder(
  tenantId: string,
  orderId: string,
  input: UpdateOrderInput
): Promise<IOrder> {
  const existing = await getOrderById(tenantId, orderId)
  if (existing.status !== OrderStatus.DRAFT && existing.status !== OrderStatus.CONFIRMED) {
    throw new AppError('ORDER_NOT_EDITABLE', 409, { status: existing.status })
  }

  const update: OrderUpdate = {}
  if (input.scheduled_date !== undefined) update.scheduled_date = input.scheduled_date ?? null
  if (input.delivery_address !== undefined) update.delivery_address = input.delivery_address ?? null
  if (input.payment_method !== undefined) update.payment_method = input.payment_method ?? null
  if (input.notes !== undefined) update.notes = input.notes ?? null

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(update)
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('ORDER_NOT_FOUND', 404, { orderId })
  return toOrder(data as Record<string, unknown>)
}

function assertValidTransition(current: OrderStatus, next: OrderStatus): void {
  const allowed = ORDER_TRANSITIONS[current] ?? []
  if (!allowed.includes(next)) {
    throw new AppError('INVALID_ORDER_TRANSITION', 409, { from: current, to: next })
  }
}

async function transitionStatus(
  tenantId: string,
  orderId: string,
  newStatus: OrderStatus,
  extra: OrderUpdate = {}
): Promise<IOrder> {
  const existing = await getOrderById(tenantId, orderId)
  assertValidTransition(existing.status, newStatus)

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus, ...extra })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('ORDER_NOT_FOUND', 404, { orderId })
  return toOrder(data as Record<string, unknown>)
}

export async function confirmOrder(tenantId: string, orderId: string): Promise<IOrder> {
  return transitionStatus(tenantId, orderId, OrderStatus.CONFIRMED)
}

export async function assignDriver(
  tenantId: string,
  orderId: string,
  driverId: string
): Promise<IOrder> {
  const { data: driver, error: driverError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', driverId)
    .eq('tenant_id', tenantId)
    .single()

  if (driverError || !driver) throw new AppError('DRIVER_NOT_FOUND', 404, { driverId })
  if ((driver as Record<string, unknown>)['role'] !== 'DRIVER') {
    throw new AppError('USER_NOT_A_DRIVER', 400, { driverId })
  }

  return transitionStatus(tenantId, orderId, OrderStatus.ASSIGNED, {
    assigned_driver_id: driverId,
  })
}

export async function markOutForDelivery(tenantId: string, orderId: string): Promise<IOrder> {
  return transitionStatus(tenantId, orderId, OrderStatus.OUT_FOR_DELIVERY)
}

export async function confirmDelivery(
  tenantId: string,
  orderId: string,
  input: ConfirmDeliveryInput
): Promise<IOrder> {
  const order = await getOrderById(tenantId, orderId)
  assertValidTransition(order.status, OrderStatus.DELIVERED)

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      await deductStock(
        tenantId,
        item.productId,
        item.quantity,
        `Order ${order.orderNumber}`,
        order.createdBy,
        orderId,
        'order'
      )
    }
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: OrderStatus.DELIVERED,
      empties_collected: input.empties_collected,
      delivery_photo_url: input.delivery_photo_url ?? null,
    })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('ORDER_NOT_FOUND', 404, { orderId })

  await pdfQueue.add('generate-invoice', { tenantId, orderId })
  await notificationQueue.add('delivery-sms', {
    tenantId,
    orderId,
    customerId: order.customerId,
  })

  return toOrder(data as Record<string, unknown>)
}

export async function cancelOrder(
  tenantId: string,
  orderId: string,
  reason: string | null
): Promise<IOrder> {
  return transitionStatus(tenantId, orderId, OrderStatus.CANCELLED, {
    notes: reason ?? undefined,
  })
}

export async function markFailed(tenantId: string, orderId: string): Promise<IOrder> {
  return transitionStatus(tenantId, orderId, OrderStatus.FAILED)
}

export async function getDriverTodayOrders(driverId: string, tenantId: string): Promise<IOrder[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('assigned_driver_id', driverId)
    .eq('scheduled_date', today)
    .in('status', [OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY])
    .order('created_at', { ascending: true })

  if (error) throw new AppError('ORDERS_FETCH_FAILED', 500)
  return (data as Record<string, unknown>[]).map((r) => toOrder(r))
}
