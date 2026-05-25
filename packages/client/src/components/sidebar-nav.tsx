'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Truck,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'
import axios from 'axios'

export function SidebarNav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/orders',    label: t('orders'),    icon: ShoppingCart },
    { href: '/customers', label: t('customers'), icon: Users },
    { href: '/products',  label: t('products'),  icon: Package },
    { href: '/invoices',  label: t('invoices'),  icon: FileText },
    { href: '/drivers',   label: t('drivers'),   icon: Truck },
    { href: '/settings',  label: t('settings'),  icon: Settings },
  ]

  const otherLocale = locale === 'en' ? 'ne' : 'en'
  const switchPath = pathname.replace(`/${locale}/`, `/${otherLocale}/`)

  const handleLogout = async () => {
    await axios.post('/api/auth/logout').catch(() => null)
    clearAuth()
    router.push(`/${locale}/login`)
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-slate-200">
        <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.5 11 4 15 4 17.5a8 8 0 0 0 16 0C20 15 17.5 11 12 2z" />
        </svg>
        <span className="font-bold text-slate-900">
          {locale === 'ne' ? 'पानीसेवा' : 'Panisewa'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const fullHref = `/${locale}${href}`
          const active = pathname.startsWith(fullHref)
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer',
                active
                  ? 'bg-blue-50 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Language switcher */}
      <div className="px-2 pb-2">
        <Link
          href={switchPath}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors duration-150 w-full"
        >
          <Globe className="w-4 h-4 shrink-0" />
          {t('switchLanguage')}
        </Link>
      </div>

      {/* User + logout */}
      <div className="border-t border-slate-200 p-3">
        {user && (
          <div className="px-3 py-1.5 mb-1">
            <p className="text-xs font-medium text-slate-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          {t('signOut')}
        </button>
      </div>
    </aside>
  )
}
