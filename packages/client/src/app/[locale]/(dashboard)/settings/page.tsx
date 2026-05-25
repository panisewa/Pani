'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import type { ITenant, SingleResponse } from '@/lib/api-types'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const { data, isLoading, isError } = useQuery<SingleResponse<ITenant>>({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get<SingleResponse<ITenant>>('/tenant')
      return res.data
    },
  })

  const tenant = data?.data

  if (isLoading) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-red-600">
          {tCommon('failedToLoad')}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Business info */}
      <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{t('businessInfo')}</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Row label={t('businessName')} value={tenant?.name} />
          <Row label={t('urlSlug')} value={tenant?.slug} mono />
          <Row label={t('plan')} value={tenant?.plan?.toUpperCase()} />
          <Row
            label={t('status')}
            value={
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                tenant?.status === 'active'
                  ? 'bg-green-50 text-green-700'
                  : tenant?.status === 'trial'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                {tenant?.status?.toUpperCase()}
              </span>
            }
          />
        </div>
      </section>

      {/* Billing settings */}
      <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{t('billingTax')}</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Row
            label={t('vatRegistered')}
            value={tenant?.settings?.vatRegistered ? t('yes') : t('no')}
          />
          <Row
            label={t('panNumber')}
            value={tenant?.settings?.panNumber ?? '—'}
            mono
          />
          <Row
            label={t('fiscalYear')}
            value={tenant?.settings?.fiscalYear ?? '—'}
          />
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{t('contact')}</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Row label={t('phone')} value={tenant?.settings?.phone ?? '—'} mono />
          <Row label={t('address')} value={tenant?.settings?.address ?? '—'} />
          <Row
            label={t('defaultLanguage')}
            value={tenant?.settings?.defaultLanguage === 'ne' ? 'नेपाली' : 'English'}
          />
        </div>
      </section>

      <p className="text-xs text-slate-400">
        {t('apiHint')} <code className="font-mono bg-slate-100 px-1 rounded">PATCH /api/v1/tenant/settings</code>
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 shrink-0 text-sm text-slate-500">{label}</span>
      <span className={`text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}
