import type { Metadata } from 'next'
import {
  Inter,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
  Mukta,
} from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
})

const mukta = Mukta({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mukta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Panisewa', template: '%s | Panisewa' },
  description: 'Water delivery management platform — पानीसेवा',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={[
        inter.variable,
        jetbrainsMono.variable,
        notoSansDevanagari.variable,
        mukta.variable,
      ].join(' ')}
    >
      <body className="bg-background font-sans antialiased">{children}</body>
    </html>
  )
}
