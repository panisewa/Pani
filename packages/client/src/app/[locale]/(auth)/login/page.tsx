'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Globe, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { loginSchema, type LoginInput } from '@panisewa/shared'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const t = useTranslations('auth.login')
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
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginInput) => {
    setServerError(null)
    try {
      const res = await axios.post<{
        success: boolean
        data: {
          accessToken: string
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
      }>('/api/auth/login', values)

      const { accessToken, user } = res.data.data
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
        const code = err.response?.data?.error?.code as string | undefined
        if (err.response?.status === 401 || code === 'INVALID_CREDENTIALS') {
          setServerError(tErrors('invalidCredentials'))
        } else if (code === 'ACCOUNT_INACTIVE') {
          setServerError(tErrors('accountInactive'))
        } else if (!err.response) {
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
            {/* Water drop icon — inline SVG avoids emoji */}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-600 mt-1">{t('subtitle')}</p>
        </div>

        {/* Language toggle */}
        <Link
          href={`/${otherLocale}/login`}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors duration-150 cursor-pointer mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          aria-label={`${tCommon('language')}: ${otherLocaleLabel}`}
        >
          <Globe className="w-4 h-4" />
          <span>{otherLocaleLabel}</span>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Server error banner */}
        {serverError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              {t('email')}
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder={t('emailPlaceholder')}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'transition-colors duration-150',
                errors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200'
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                {t('password')}
              </label>
              <button
                type="button"
                // TODO: link to /forgot-password once that route exists
                className="text-xs text-primary hover:text-primary-light transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                {t('forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                className={cn(
                  'w-full rounded-md border px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'transition-colors duration-150',
                  errors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 rounded-sm"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600" role="alert">
                {errors.password.message}
              </p>
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

      {/* Register link */}
      <p className="text-center text-sm text-slate-600">
        {t('noAccount')}{' '}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-primary hover:text-primary-light transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm"
        >
          {t('registerLink')}
        </Link>
      </p>
    </div>
  )
}
