import { redirect } from 'next/navigation'
import { unstable_setRequestLocale } from 'next-intl/server'

export default function HomePage({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale)
  // TODO: redirect to dashboard once built; for now → login
  redirect(`/${params.locale}/login`)
}
