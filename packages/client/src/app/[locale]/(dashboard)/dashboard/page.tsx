import { unstable_setRequestLocale } from 'next-intl/server'

export default function DashboardPage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome to Panisewa admin panel</p>
      </div>

      {/* KPI placeholder grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {['Orders Today', 'Revenue (रू)', 'Active Drivers', 'Low Stock Items'].map((label) => (
          <div key={label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="h-7 w-20 mt-2 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Phase 5 in progress — full dashboard coming next.
        </p>
      </div>
    </div>
  )
}
