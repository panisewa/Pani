'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { OrderStatus } from '@panisewa/shared'
import type { IOrder, PaginatedResponse } from '@/lib/api-types'
import { OrderFormModal } from '@/components/orders/order-form-modal'
import { Plus } from 'lucide-react'

const STATUS_STYLES: Record<OrderStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  CONFIRMED: 'bg-blue-50 text-blue-600',
  ASSIGNED: 'bg-indigo-50 text-indigo-600',
  OUT_FOR_DELIVERY: 'bg-amber-50 text-amber-600',
  DELIVERED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Assigned',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading, isError } = useQuery<PaginatedResponse<IOrder>>({
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total orders</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      <OrderFormModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => { setStatusFilter(''); setPage(1) }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            statusFilter === ''
              ? 'bg-blue-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {Object.values(OrderStatus).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">Failed to load orders.</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No orders found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Payment</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-900">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      order.type === 'B2B'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-green-50 text-green-700'
                        : order.paymentStatus === 'PARTIAL'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900">
                    {formatPaisa(order.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString('en-NP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {page} of {Math.ceil(total / 20)}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
