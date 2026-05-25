import { unstable_setRequestLocale } from 'next-intl/server'

export default function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  unstable_setRequestLocale(params.locale)
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
