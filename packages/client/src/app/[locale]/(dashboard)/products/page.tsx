'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Plus, ImageIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatPaisa, ProductCategory } from '@panisewa/shared'
import type { IProduct, PaginatedResponse } from '@/lib/api-types'
import { AddProductSheet } from '@/components/add-product-sheet'

export default function ProductsPage() {
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const CATEGORY_LABELS: Record<ProductCategory, string> = {
    JAR_20L: t('categories.JAR_20L'),
    JAR_10L: t('categories.JAR_10L'),
    JAR_5L: t('categories.JAR_5L'),
    CUSTOM: t('categories.CUSTOM'),
  }
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('')
  const [page, setPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data, isLoading, isError } = useQuery<PaginatedResponse<IProduct>>({
    queryKey: ['products', categoryFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await api.get<PaginatedResponse<IProduct>>(`/products?${params}`)
      return res.data
    },
  })

  const products = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <>
      <AddProductSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-600 mt-0.5">{t('totalProducts', { count: total })}</p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('addProduct')}
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => { setCategoryFilter(''); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              categoryFilter === ''
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tCommon('all')}
          </button>
          {Object.values(ProductCategory).map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setPage(1) }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {CATEGORY_LABELS[cat]}
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
          ) : products.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-sm text-slate-500">{t('noProducts')}</p>
              <button
                onClick={() => setSheetOpen(true)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('addProduct')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-12 px-4 py-3" aria-label={t('image')} />
                    <th className="text-left px-4 py-3 font-medium text-slate-600">{t('name')}</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">{t('nameNe')}</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">{t('category')}</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">{t('sku')}</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">{t('priceB2c')}</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">{t('priceB2b')}</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">{t('deposit')}</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.nameEn}
                            className="w-9 h-9 rounded-md object-cover border border-slate-200 bg-slate-50"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-slate-300" aria-hidden="true" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.nameEn}</td>
                      <td
                        className="px-4 py-3 text-slate-600"
                        style={{ fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif" }}
                      >
                        {p.nameNe}
                      </td>
                      <td className="px-4 py-3">
                        {p.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {CATEGORY_LABELS[p.category]}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">{p.sku ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900">{formatPaisa(p.priceB2c)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900">{formatPaisa(p.priceB2b)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {p.depositAmount > 0 ? formatPaisa(p.depositAmount) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          p.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {p.isActive ? tCommon('active') : tCommon('inactive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </>
  )
}
