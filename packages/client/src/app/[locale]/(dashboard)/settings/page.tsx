'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ITenant, SingleResponse } from '@/lib/api-types'

export default function SettingsPage() {
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
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
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
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 text-sm text-red-600">
          Failed to load settings.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Business configuration</p>
      </div>

      {/* Business info */}
      <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Business Information</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Row label="Business Name" value={tenant?.name} />
          <Row label="URL Slug" value={tenant?.slug} mono />
          <Row label="Plan" value={tenant?.plan?.toUpperCase()} />
          <Row
            label="Status"
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
          <h2 className="font-semibold text-slate-900">Billing &amp; Tax</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Row
            label="VAT Registered"
            value={tenant?.settings?.vatRegistered ? 'Yes' : 'No'}
          />
          <Row
            label="PAN Number"
            value={tenant?.settings?.panNumber ?? '—'}
            mono
          />
          <Row
            label="Fiscal Year"
            value={tenant?.settings?.fiscalYear ?? '—'}
          />
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Contact</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Row label="Phone" value={tenant?.settings?.phone ?? '—'} mono />
          <Row label="Address" value={tenant?.settings?.address ?? '—'} />
          <Row
            label="Default Language"
            value={tenant?.settings?.defaultLanguage === 'ne' ? 'नेपाली' : 'English'}
          />
        </div>
      </section>

      <p className="text-xs text-slate-400">
        To update settings, use the API: <code className="font-mono bg-slate-100 px-1 rounded">PATCH /api/v1/tenant/settings</code>
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
