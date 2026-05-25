'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { InvoiceStatus } from '@panisewa/shared'
import type { IInvoice, PaginatedResponse } from '@/lib/api-types'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  SENT: 'bg-blue-50 text-blue-600',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function InvoicesPage() {
  const t = useTranslations('invoices')
  const tCommon = useTranslations('common')
  const STATUS_LABELS: Record<InvoiceStatus, string> = {
    DRAFT: t('statusLabels.DRAFT'),
    SENT: t('statusLabels.SENT'),
    PAID: t('statusLabels.PAID'),
    OVERDUE: t('statusLabels.OVERDUE'),
    CANCELLED: t('statusLabels.CANCELLED'),
  }
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery<PaginatedResponse<IInvoice>>({
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('totalInvoices', { count: total })}</p>
      </div>

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
          {tCommon('all')}
        </button>
        {Object.values(InvoiceStatus).map((s) => (
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
          <div className="p-6 text-sm text-red-600">{t('failedToLoad')}</div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">{t('noInvoices')}</div>
        ) : (
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-900">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-600" style={{ fontFamily: "'Noto Sans Devanagari', system-ui" }}>
                    {inv.bsDate ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{formatPaisa(inv.subtotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{formatPaisa(inv.vatAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">{formatPaisa(inv.total)}</td>
                  <td className={`px-4 py-3 ${
                    inv.status === 'OVERDUE' ? 'text-red-600 font-medium' : 'text-slate-500'
                  }`}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-NP') : '—'}
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
