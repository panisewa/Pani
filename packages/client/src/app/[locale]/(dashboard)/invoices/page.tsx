'use client'

import { useState, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { InvoiceStatus } from '@panisewa/shared'
import type { IInvoice, PaginatedResponse } from '@/lib/api-types'
import { Search, FileText } from 'lucide-react'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  SENT:      'bg-blue-50 text-blue-700',
  PAID:      'bg-green-50 text-green-700',
  OVERDUE:   'bg-red-50 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function InvoicesPage() {
  const t = useTranslations('invoices')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const STATUS_LABELS: Record<InvoiceStatus, string> = {
    DRAFT:     t('statusLabels.DRAFT'),
    SENT:      t('statusLabels.SENT'),
    PAID:      t('statusLabels.PAID'),
    OVERDUE:   t('statusLabels.OVERDUE'),
    CANCELLED: t('statusLabels.CANCELLED'),
  }

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [searchRaw, setSearchRaw] = useState('')
  const search = useDeferredValue(searchRaw)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse<IInvoice>>({
    queryKey: ['invoices', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get<PaginatedResponse<IInvoice>>(`/invoices?${params}`)
      return res.data
    },
  })

  const invoices = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const visible = search
    ? invoices.filter((inv) => inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
    : invoices

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-600 mt-0.5">{t('totalInvoices', { count: total })}</p>
      </div>

      {/* Search + status filters */}
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
          {Object.values(InvoiceStatus).map((s) => (
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
              <FileText className="w-6 h-6 text-slate-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {search ? t('noInvoices') : t('noInvoices')}
              </p>
              {!search && !statusFilter && (
                <p className="text-xs text-slate-400 mt-1">{t('noInvoicesEmpty')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('invoiceNumber')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('bsDate')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('status')}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">{t('subtotal')}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">{t('vat')}</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">{t('total')}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{t('dueDate')}</th>
                  <th className="w-16 px-4 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/${locale}/invoices/${inv.id}`)}
                    className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td
                      className="px-4 py-3 text-slate-600"
                      style={{ fontFamily: "'Noto Sans Devanagari', system-ui" }}
                    >
                      {inv.bsDate ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[inv.status]}`}
                      >
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      {formatPaisa(inv.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                      {formatPaisa(inv.vatAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatPaisa(inv.total)}
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        inv.status === 'OVERDUE' ? 'text-red-600 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                        {t('viewInvoice')}
                      </span>
                    </td>
                  </tr>
                ))}
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
