'use client'

import { useState, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { OrderStatus } from '@panisewa/shared'
import type { IOrder, PaginatedResponse } from '@/lib/api-types'
import { NewOrderSheet } from '@/components/orders/new-order-sheet'
import { OrderDetailSheet } from '@/components/orders/order-detail-sheet'
import { Plus, Search, ShoppingCart } from 'lucide-react'

const STATUS_STYLES: Record<OrderStatus, string> = {
  DRAFT:            'bg-slate-100 text-slate-600',
  CONFIRMED:        'bg-blue-50 text-blue-700',
  ASSIGNED:         'bg-indigo-50 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-amber-50 text-amber-700',
  DELIVERED:        'bg-green-50 text-green-700',
  FAILED:           'bg-red-50 text-red-700',
  CANCELLED:        'bg-slate-100 text-slate-500',
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID:    'bg-green-50 text-green-700',
  PARTIAL: 'bg-amber-50 text-amber-700',
  PENDING: 'bg-slate-100 text-slate-600',
}

const TERMINAL = new Set<OrderStatus>([OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED])

export default function OrdersPage() {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')

  const STATUS_LABELS: Record<OrderStatus, string> = {
    DRAFT:            t('statusLabels.DRAFT'),
    CONFIRMED:        t('statusLabels.CONFIRMED'),
    ASSIGNED:         t('statusLabels.ASSIGNED'),
    OUT_FOR_DELIVERY: t('statusLabels.OUT_FOR_DELIVERY'),
    DELIVERED:        t('statusLabels.DELIVERED'),
    FAILED:           t('statusLabels.FAILED'),
    CANCELLED:        t('statusLabels.CANCELLED'),
  }

  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [searchRaw, setSearchRaw] = useState('')
  const search = useDeferredValue(searchRaw)
  const [page, setPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse<IOrder>>({
    queryKey: ['orders', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get<PaginatedResponse<IOrder>>(`/orders?${params}`)
      return res.data
    },
  })

  const orders = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const visible = search
    ? orders.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()))
    : orders

  return (
    <div className="space-y-5">
      <NewOrderSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      <OrderDetailSheet
        orderId={selectedOrderId}
        onOpenChange={(open) => { if (!open) setSelectedOrderId(null) }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600 mt-0.5">{t('totalOrders', { count: total })}</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('newOrder')}
        </button>
      </div>

      {/* Search + Status filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative w-full sm:w-56 shrink-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => { setStatusFilter(''); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tCommon('all')}
          </button>
          {Object.values(OrderStatus).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-red-600">{t('failedToLoad')}</p>
            <button
              onClick={() => refetch()}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-slate-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {search ? t('noOrdersFiltered') : t('noOrders')}
              </p>
              {!search && !statusFilter && (
                <p className="text-xs text-slate-400 mt-1">{t('noOrdersEmpty')}</p>
              )}
            </div>
            {!search && !statusFilter && (
              <button
                onClick={() => setSheetOpen(true)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('newOrder')} →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('orderNumber')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('type')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('status')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('payment')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('scheduledDate')}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">{t('total')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((order) => {
                  const isOverdue =
                    order.scheduledDate &&
                    new Date(order.scheduledDate) < new Date() &&
                    !TERMINAL.has(order.status)

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.type === 'B2B'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-orange-50 text-orange-700'
                          }`}
                        >
                          {order.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[order.status]}`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            PAYMENT_STATUS_STYLES[order.paymentStatus] ?? PAYMENT_STATUS_STYLES['PENDING']
                          }`}
                        >
                          {t(`paymentStatus.${order.paymentStatus}` as Parameters<typeof t>[0])}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {order.scheduledDate ? (
                          <span
                            className={`text-sm ${
                              isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                            }`}
                          >
                            {new Date(order.scheduledDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {isOverdue && (
                              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide">
                                {t('overdue')}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                        {formatPaisa(order.total)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{tCommon('pageOf', { page, total: totalPages })}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {tCommon('previous')}
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {tCommon('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
