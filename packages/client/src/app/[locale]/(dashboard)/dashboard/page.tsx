'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { ShoppingCart, TrendingUp, AlertTriangle, Users, Clock, Truck } from 'lucide-react'
import type { SingleResponse } from '@/lib/api-types'

interface DashboardStats {
  ordersToday: number
  revenueToday: number
  pendingOrders: number
  activeDrivers: number
  lowStockCount: number
  totalCustomers: number
}

function KpiCard({
  label,
  value,
  icon,
  sub,
  alert = false,
  loading = false,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  sub?: string
  alert?: boolean
  loading?: boolean
}) {
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-5 flex flex-col gap-3 ${
      alert ? 'border-amber-300' : 'border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`w-8 h-8 rounded-md flex items-center justify-center ${
          alert ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-700'
        }`}>
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-28 rounded bg-slate-100 animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-slate-900 font-mono">{value}</p>
      )}
      {sub && !loading && (
        <p className="text-xs text-slate-400">{sub}</p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { data, isLoading } = useQuery<SingleResponse<DashboardStats>>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<SingleResponse<DashboardStats>>('/stats/dashboard')
      return res.data
    },
    refetchInterval: 60_000,
  })

  const stats = data?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('en-NP', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          label={t('ordersToday')}
          value={stats?.ordersToday ?? 0}
          icon={<ShoppingCart className="w-4 h-4" />}
          sub={t('createdLast24h')}
          loading={isLoading}
        />
        <KpiCard
          label={t('revenueToday')}
          value={stats ? formatPaisa(stats.revenueToday) : '—'}
          icon={<TrendingUp className="w-4 h-4" />}
          sub={t('deliveredOnly')}
          loading={isLoading}
        />
        <KpiCard
          label={t('pendingOrders')}
          value={stats?.pendingOrders ?? 0}
          icon={<Clock className="w-4 h-4" />}
          sub={t('draftConfirmedAssigned')}
          loading={isLoading}
        />
        <KpiCard
          label={t('activeDrivers')}
          value={stats?.activeDrivers ?? 0}
          icon={<Truck className="w-4 h-4" />}
          loading={isLoading}
        />
        <KpiCard
          label={t('totalCustomers')}
          value={stats?.totalCustomers ?? 0}
          icon={<Users className="w-4 h-4" />}
          loading={isLoading}
        />
        <KpiCard
          label={t('lowStockItems')}
          value={stats?.lowStockCount ?? 0}
          icon={<AlertTriangle className="w-4 h-4" />}
          sub={stats?.lowStockCount ? t('needsRestocking') : t('allLevelsOk')}
          alert={(stats?.lowStockCount ?? 0) > 0}
          loading={isLoading}
        />
      </div>

      {!isLoading && (stats?.lowStockCount ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-amber-800 font-medium">
            {t('lowStockAlert', { count: stats!.lowStockCount })}
          </span>
        </div>
      )}
    </div>
  )
}
