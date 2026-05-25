import { unstable_setRequestLocale } from 'next-intl/server'
import { SidebarNav } from '@/components/sidebar-nav'

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  unstable_setRequestLocale(params.locale)
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100">
      <div className="print:hidden"><SidebarNav /></div>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
