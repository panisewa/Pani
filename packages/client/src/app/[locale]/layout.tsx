import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, unstable_setRequestLocale } from 'next-intl/server'
import { locales, type Locale } from '@/i18n'
import { Providers } from '@/components/providers'
import { LocaleHtmlLang } from '@/components/locale-html-lang'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const locale = params.locale as Locale
  if (!locales.includes(locale)) notFound()

  unstable_setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlLang locale={locale} />
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  )
}
