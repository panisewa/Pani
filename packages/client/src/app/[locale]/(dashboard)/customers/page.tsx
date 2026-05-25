'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import type { ICustomer, PaginatedResponse } from '@/lib/api-types'
import { CustomerFormModal } from '@/components/customers/customer-form-modal'
import { Plus, Pencil } from 'lucide-react'

export default function CustomersPage() {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const [typeFilter, setTypeFilter] = useState<'B2C' | 'B2B' | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<ICustomer | undefined>()

  const { data, isLoading, isError } = useQuery<PaginatedResponse<ICustomer>>({
    queryKey: ['customers', typeFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (typeFilter) params.set('type', typeFilter)
      if (search) params.set('search', search)
      const res = await api.get<PaginatedResponse<ICustomer>>(`/customers?${params}`)
      return res.data
    },
  })

  const customers = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('totalCustomers', { count: total })}</p>
        </div>
        <button
          onClick={() => { setEditCustomer(undefined); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" />
          {t('newCustomer')}
        </button>
      </div>

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editCustomer}
      />

      <div className="flex gap-3 flex-wrap">
        {/* Type filter */}
        <div className="flex gap-1">
          {(['', 'B2C', 'B2B'] as const).map((typeVal) => (
            <button
              key={typeVal}
              onClick={() => { setTypeFilter(typeVal); setPage(1) }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === typeVal
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {typeVal === '' ? tCommon('all') : typeVal}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 min-w-48 px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">{t('failedToLoad')}</div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">{t('noCustomers')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('name')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('type')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('phone')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('email')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('creditLimit')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('status')}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      c.type === 'B2B'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900">
                    {c.creditLimit > 0 ? formatPaisa(c.creditLimit) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      c.isActive
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.isActive ? tCommon('active') : tCommon('inactive')}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => { setEditCustomer(c); setModalOpen(true) }}
                      className="p-1.5 text-slate-400 hover:text-blue-700 rounded"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{tCommon('pageOf', { page, total: Math.ceil(total / 20) })}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {tCommon('previous')}
            </button>
            <button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {tCommon('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
