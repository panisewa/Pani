'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Globe, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { registerTenantSchema, type RegisterTenantInput } from '@panisewa/shared'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const t = useTranslations('auth.register')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('auth.errors')
  const locale = useLocale()
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterTenantInput>({
    resolver: zodResolver(registerTenantSchema),
  })

  // Auto-generate slug from business name
  const onTenantNameBlur = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setValue('tenantSlug', slug, { shouldValidate: true })
  }

  const onSubmit = async (values: RegisterTenantInput) => {
    setServerError(null)
    try {
      // Register hits Express backend directly (no cookie needed at register)
      const res = await axios.post<{
        success: boolean
        data: {
          accessToken: string
          refreshToken: string
          expiresIn: number
          user: {
            id: string
            email: string
            role: string
            tenantId: string
            firstName: string | null
            lastName: string | null
          }
        }
        error?: { code: string }
      }>(
        `${process.env['NEXT_PUBLIC_API_URL']}/auth/register`,
        values,
        { withCredentials: false }
      )

      // After register, use login BFF to set httpOnly cookie
      await axios.post('/api/auth/login', {
        email: values.email,
        password: values.password,
      })

      const { user, accessToken } = res.data.data
      setAuth(accessToken, {
        id: user.id,
        email: user.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: user.role as any,
        tenantId: user.tenantId,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      router.push(`/${locale}/dashboard`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setServerError(tErrors('networkError'))
        } else {
          setServerError(tErrors('unknown'))
        }
      } else {
        setServerError(tErrors('unknown'))
      }
    }
  }

  const otherLocale = locale === 'en' ? 'ne' : 'en'
  const otherLocaleLabel = locale === 'en' ? tCommon('nepali') : tCommon('english')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-8 h-8 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.5 11 4 15 4 17.5a8 8 0 0 0 16 0C20 15 17.5 11 12 2z" />
            </svg>
            <span className="text-xl font-bold text-slate-900">
              {tCommon('appName')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        <Link
          href={`/${otherLocale}/register`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors duration-150 cursor-pointer mt-1"
          aria-label={`${tCommon('language')}: ${otherLocaleLabel}`}
        >
          <Globe className="w-4 h-4" />
          <span>{otherLocaleLabel}</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
        {serverError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Business name */}
          <div className="space-y-1.5">
            <label htmlFor="tenantName" className="block text-sm font-medium text-slate-700">
              {t('tenantName')}
            </label>
            <input
              {...register('tenantName')}
              id="tenantName"
              type="text"
              autoComplete="organization"
              placeholder={t('tenantNamePlaceholder')}
              onBlur={(e) => onTenantNameBlur(e.target.value)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150',
                errors.tenantName ? 'border-red-400' : 'border-slate-200'
              )}
            />
            {errors.tenantName && (
              <p className="text-xs text-red-600" role="alert">{errors.tenantName.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label htmlFor="tenantSlug" className="block text-sm font-medium text-slate-700">
              {t('tenantSlug')}
            </label>
            <div className="flex rounded-md border overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors duration-150"
              style={{ borderColor: errors.tenantSlug ? '#f87171' : '#e2e8f0' }}
            >
              <span className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-sm text-slate-500 select-none">
                panisewa.com/
              </span>
              <input
                {...register('tenantSlug')}
                id="tenantSlug"
                type="text"
                placeholder={t('tenantSlugPlaceholder')}
                className="flex-1 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-white"
              />
            </div>
            <p className="text-xs text-slate-500">{t('tenantSlugHint')}</p>
            {errors.tenantSlug && (
              <p className="text-xs text-red-600" role="alert">{errors.tenantSlug.message}</p>
            )}
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                {t('firstName')}
              </label>
              <input
                {...register('firstName')}
                id="firstName"
                type="text"
                autoComplete="given-name"
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm text-slate-900',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150',
                  errors.firstName ? 'border-red-400' : 'border-slate-200'
                )}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600" role="alert">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                {t('lastName')}
              </label>
              <input
                {...register('lastName')}
                id="lastName"
                type="text"
                autoComplete="family-name"
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm text-slate-900',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150',
                  errors.lastName ? 'border-red-400' : 'border-slate-200'
                )}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600" role="alert">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              {t('email')}
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm text-slate-900',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150',
                errors.email ? 'border-red-400' : 'border-slate-200'
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-600" role="alert">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t('password')}
            </label>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn(
                  'w-full rounded-md border px-3 py-2 pr-10 text-sm text-slate-900',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150',
                  errors.password ? 'border-red-400' : 'border-slate-200'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">{t('passwordHint')}</p>
            {errors.password && (
              <p className="text-xs text-red-600" role="alert">{errors.password.message}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
              {t('phone')}
            </label>
            <input
              {...register('phone')}
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150',
                errors.phone ? 'border-red-400' : 'border-slate-200'
              )}
            />
            <p className="text-xs text-slate-500">{t('phoneHint')}</p>
            {errors.phone && (
              <p className="text-xs text-red-600" role="alert">{errors.phone.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white',
              'hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              'transition-colors duration-150 cursor-pointer',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500">
        {t('hasAccount')}{' '}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-primary hover:text-primary-light transition-colors duration-150 cursor-pointer"
        >
          {t('loginLink')}
        </Link>
      </p>
    </div>
  )
}
