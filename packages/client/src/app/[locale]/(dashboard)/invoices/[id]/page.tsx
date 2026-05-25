'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { ArrowLeft, Printer, Lock, FileText } from 'lucide-react'
import type { IInvoice, ITenant, SingleResponse } from '@/lib/api-types'
import { InvoiceDocument, type DocumentType } from '@/components/invoices/invoice-document'

const DOC_TYPES: { value: DocumentType; premium: boolean }[] = [
  { value: 'TAX_INVOICE', premium: false },
  { value: 'QUOTATION',   premium: true },
  { value: 'RECEIPT',     premium: true },
]

const FALLBACK_TENANT: ITenant = {
  id: '',
  name: 'Panisewa',
  slug: '',
  logoUrl: null,
  status: 'active',
  plan: 'starter',
  settings: {},
  createdAt: '',
}

export default function InvoiceDetailPage() {
  const t = useTranslations('invoices')
  const locale = useLocale()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id
  const [docType, setDocType] = useState<DocumentType>('TAX_INVOICE')

  const { data: invoiceData, isLoading, isError } = useQuery<SingleResponse<IInvoice>>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get<SingleResponse<IInvoice>>(`/invoices/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  const { data: tenantData } = useQuery<SingleResponse<ITenant>>({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get<SingleResponse<ITenant>>('/tenant')
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const invoice = invoiceData?.data
  const tenant = tenantData?.data ?? FALLBACK_TENANT
  const canCustomize = tenant.settings?.customDocumentTypes === true

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden space-y-4 mb-6">
        {/* Nav + print bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(`/${locale}/invoices`)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToInvoices')}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            {t('downloadPdf')}
          </button>
        </div>

        {/* Document type selector */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {t('documentType')}
          </p>

          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map(({ value, premium }) => {
              const locked = premium && !canCustomize
              const active = docType === value

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => { if (!locked) setDocType(value) }}
                  disabled={locked}
                  title={locked ? `${t('premiumFeature')}: ${t('premiumFeatureDesc')}` : undefined}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    locked
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      : active
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {locked ? (
                    <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                  ) : active ? (
                    <FileText className="w-3 h-3 shrink-0" aria-hidden="true" />
                  ) : null}
                  {t(`documentTypes.${value}` as Parameters<typeof t>[0])}
                </button>
              )
            })}
          </div>

          {!canCustomize && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-amber-800">{t('premiumFeature')}</p>
                <p className="text-xs text-amber-700 mt-0.5">{t('premiumFeatureDesc')}</p>
                <p className="text-xs text-amber-600 mt-1 italic">{t('premiumContactHint')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice content */}
      {isLoading ? (
        <div className="print:hidden bg-white rounded-lg border border-slate-200 shadow-sm p-10 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-7 bg-slate-100 rounded animate-pulse" style={{ width: `${70 + (i % 3) * 15}%` }} />
          ))}
        </div>
      ) : isError || !invoice ? (
        <div className="print:hidden bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center">
          <p className="text-sm text-red-600 mb-3">{t('failedToLoadDetail')}</p>
          <button
            onClick={() => router.push(`/${locale}/invoices`)}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('backToInvoices')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <InvoiceDocument
            invoice={invoice}
            tenant={tenant}
            documentType={docType}
          />
        </div>
      )}
    </>
  )
}
