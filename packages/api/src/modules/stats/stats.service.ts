import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { getLowStockItems } from '../inventory/inventory.service.js'

export interface IDashboardStats {
  ordersToday: number
  revenueToday: number       // paisa — DELIVERED orders created today
  pendingOrders: number      // DRAFT + CONFIRMED + ASSIGNED
  activeDrivers: number
  lowStockCount: number
  totalCustomers: number
}

export async function getDashboardStats(tenantId: string): Promise<IDashboardStats> {
  const today = new Date().toISOString().slice(0, 10)

  const [ordersRes, revenueRes, pendingRes, driversRes, customersRes, lowStock] =
    await Promise.all([
      // orders created today (any status)
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`),

      // revenue = sum of totals for DELIVERED orders today
      supabaseAdmin
        .from('orders')
        .select('total')
        .eq('tenant_id', tenantId)
        .eq('status', 'DELIVERED')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`),

      // pending = DRAFT + CONFIRMED + ASSIGNED (need attention)
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['DRAFT', 'CONFIRMED', 'ASSIGNED']),

      // drivers = users with DRIVER role
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'DRIVER')
        .eq('is_active', true),

      // total active customers
      supabaseAdmin
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),

      // low stock items
      getLowStockItems(tenantId),
    ])

  if (ordersRes.error) throw new AppError('STATS_FETCH_FAILED', 500)
  if (pendingRes.error) throw new AppError('STATS_FETCH_FAILED', 500)
  if (driversRes.error) throw new AppError('STATS_FETCH_FAILED', 500)
  if (customersRes.error) throw new AppError('STATS_FETCH_FAILED', 500)

  const revenueToday = revenueRes.error
    ? 0
    : ((revenueRes.data ?? []) as { total: number }[]).reduce(
        (sum, o) => sum + (o.total ?? 0),
        0
      )

  return {
    ordersToday: ordersRes.count ?? 0,
    revenueToday,
    pendingOrders: pendingRes.count ?? 0,
    activeDrivers: driversRes.count ?? 0,
    lowStockCount: lowStock.length,
    totalCustomers: customersRes.count ?? 0,
  }
}
