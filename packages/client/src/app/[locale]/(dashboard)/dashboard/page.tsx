'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { ShoppingCart, TrendingUp, AlertTriangle, Users, Clock, Truck, Package } from 'lucide-react'
import type { SingleResponse, PaginatedResponse, IOrder } from '@/lib/api-types'

interface DashboardStats {
  ordersToday: number
  revenueToday: number
  pendingOrders: number
  activeDrivers: number
  lowStockCount: number
  totalCustomers: number
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  DRAFT:            { color: '#94A3B8', bg: 'bg-slate-100 text-slate-600' },
  CONFIRMED:        { color: '#3B82F6', bg: 'bg-blue-50 text-blue-700' },
  ASSIGNED:         { color: '#8B5CF6', bg: 'bg-violet-50 text-violet-700' },
  OUT_FOR_DELIVERY: { color: '#F97316', bg: 'bg-orange-50 text-orange-700' },
  DELIVERED:        { color: '#16A34A', bg: 'bg-green-50 text-green-700' },
  FAILED:           { color: '#EF4444', bg: 'bg-red-50 text-red-700' },
  CANCELLED:        { color: '#CBD5E1', bg: 'bg-slate-50 text-slate-500' },
}

const PIPELINE_STATUSES = ['DRAFT', 'CONFIRMED', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const

function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations('orders')
  const bg = STATUS_CONFIG[status]?.bg ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg}`}>
      {t(`statusLabels.${status}` as Parameters<typeof t>[0])}
    </span>
  )
}

function PipelineDonut({ orders }: { orders: IOrder[] }) {
  const t = useTranslations('orders')

  const counts: Record<string, number> = {}
  for (const s of PIPELINE_STATUSES) {
    counts[s] = orders.filter(o => o.status === s).length
  }

  const total = PIPELINE_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0)

  let cursor = 0
  const segments = PIPELINE_STATUSES.map(s => {
    const pct = total > 0 ? ((counts[s] ?? 0) / total) * 100 : 0
    const color = STATUS_CONFIG[s]?.color ?? '#94A3B8'
    const seg = `${color} ${cursor.toFixed(2)}% ${(cursor + pct).toFixed(2)}%`
    cursor += pct
    return seg
  })

  const gradient =
    total > 0
      ? `conic-gradient(${segments.join(', ')})`
      : 'conic-gradient(#E2E8F0 0% 100%)'

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: 112, height: 112 }}>
        <div className="w-full h-full rounded-full" style={{ background: gradient }} />
        <div
          className="absolute rounded-full bg-white flex flex-col items-center justify-center"
          style={{ inset: 20 }}
        >
          <span className="text-xl font-bold text-slate-900 font-mono leading-none">{total}</span>
          <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">orders</span>
        </div>
      </div>

      <div className="space-y-2 flex-1 min-w-0">
        {PIPELINE_STATUSES.map(s => (
          <div key={s} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: STATUS_CONFIG[s]?.color ?? '#94A3B8' }}
              />
              <span className="text-xs text-slate-600 truncate">
                {t(`statusLabels.${s}` as Parameters<typeof t>[0])}
              </span>
            </div>
            <span className="text-sm font-mono font-semibold text-slate-900 tabular-nums shrink-0">
              {counts[s] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const router = useRouter()

  const { data: statsData, isLoading: statsLoading } = useQuery<SingleResponse<DashboardStats>>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<SingleResponse<DashboardStats>>('/stats/dashboard')
      return res.data
    },
    refetchInterval: 60_000,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery<PaginatedResponse<IOrder>>({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<IOrder>>('/orders?limit=50&page=1')
      return res.data
    },
    refetchInterval: 60_000,
  })

  const stats = statsData?.data
  const allOrders = ordersData?.data ?? []
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const compactMetrics = [
    {
      label: t('pendingOrders'),
      value: stats?.pendingOrders ?? 0,
      icon: <Clock className="w-3 h-3" />,
      sub: t('draftConfirmedAssigned'),
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: t('activeDrivers'),
      value: stats?.activeDrivers ?? 0,
      icon: <Truck className="w-3 h-3" />,
      sub: null,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: t('totalCustomers'),
      value: stats?.totalCustomers ?? 0,
      icon: <Users className="w-3 h-3" />,
      sub: null,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: t('lowStockItems'),
      value: stats?.lowStockCount ?? 0,
      icon: <Package className="w-3 h-3" />,
      sub: (stats?.lowStockCount ?? 0) > 0 ? t('needsRestocking') : t('allLevelsOk'),
      color:
        (stats?.lowStockCount ?? 0) > 0
          ? 'text-amber-600 bg-amber-50'
          : 'text-slate-500 bg-slate-50',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-600 mt-0.5">{dateStr}</p>
      </div>

      {/* Low stock alert */}
      {!statsLoading && (stats?.lowStockCount ?? 0) > 0 && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-800 font-medium">
              {t('lowStockAlert', { count: stats!.lowStockCount })}
            </span>
          </div>
          <button
            onClick={() => router.push(`/${locale}/products`)}
            className="text-amber-700 font-medium hover:text-amber-900 transition-colors shrink-0 text-xs"
          >
            {t('viewProducts')} →
          </button>
        </div>
      )}

      {/* Tier 1: 2 primary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <p className="text-sm font-medium text-slate-600">{t('ordersToday')}</p>
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          {statsLoading ? (
            <div className="h-10 w-16 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className="text-4xl font-bold text-slate-900 font-mono tabular-nums leading-none">
              {stats?.ordersToday ?? 0}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">{t('createdLast24h')}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <p className="text-sm font-medium text-slate-600">{t('revenueToday')}</p>
            <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          {statsLoading ? (
            <div className="h-10 w-36 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-slate-900 font-mono tabular-nums leading-none">
              {stats ? formatPaisa(stats.revenueToday) : '—'}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">{t('deliveredOnly')}</p>
        </div>
      </div>

      {/* Tier 2: compact 4-cell strip */}
      <div className="bg-slate-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px">
          {compactMetrics.map(({ label, value, icon, sub, color }) => (
            <div key={label} className="bg-white px-5 py-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-5 h-5 rounded flex items-center justify-center ${color}`}>
                  {icon}
                </span>
                <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
              </div>
              {statsLoading ? (
                <div className="h-7 w-12 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{value}</p>
              )}
              {sub && !statsLoading && (
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tier 3: pipeline + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order pipeline donut */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">{t('orderPipeline')}</h2>
          {ordersLoading ? (
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-full bg-slate-100 animate-pulse shrink-0" />
              <div className="space-y-3 flex-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-3 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <PipelineDonut orders={allOrders} />
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <h2 className="text-sm font-semibold text-slate-900">{t('recentOrders')}</h2>
            <button
              onClick={() => router.push(`/${locale}/orders`)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('viewAll')} →
            </button>
          </div>

          {ordersLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-sm text-slate-400">{t('noRecentOrders')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentOrders.map(order => (
                <div key={order.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium text-slate-900">
                      #{order.orderNumber}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-mono text-slate-700 tabular-nums">
                      {formatPaisa(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
