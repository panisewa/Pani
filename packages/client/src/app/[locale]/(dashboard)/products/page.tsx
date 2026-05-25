'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPaisa, ProductCategory } from '@panisewa/shared'
import type { IProduct, PaginatedResponse } from '@/lib/api-types'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  JAR_20L: '20L Jar',
  JAR_10L: '10L Jar',
  JAR_5L: '5L Jar',
  CUSTOM: 'Custom',
}

export default function ProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('')
  const [page, setPage] = useState(1)

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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500 mt-0.5">{total} total products</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => { setCategoryFilter(''); setPage(1) }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            categoryFilter === ''
              ? 'bg-blue-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {Object.values(ProductCategory).map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-700 text-white'
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
          <div className="p-6 text-sm text-red-600">Failed to load products.</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No products found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">नाम</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">B2C Price</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">B2B Price</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Deposit</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.nameEn}</td>
                  <td className="px-4 py-3 text-slate-600" style={{ fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif" }}>
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
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
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
