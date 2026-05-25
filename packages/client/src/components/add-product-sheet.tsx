'use client'

import { useState, useRef, useCallback, type FormEvent, type DragEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Plus, ImageIcon, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { api } from '@/lib/api'
import { parsePaisa, ProductCategory } from '@panisewa/shared'
import type { IProduct } from '@/lib/api-types'
import { cn } from '@/lib/utils'

interface AddProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_FORM = {
  nameEn: '',
  nameNe: '',
  sku: '',
  category: '' as ProductCategory | '',
  priceB2c: '',
  priceB2b: '',
  deposit: '',
  reorderLevel: '10',
}

type FormErrors = Partial<Record<keyof typeof EMPTY_FORM, string>>

export function AddProductSheet({ open, onOpenChange }: AddProductSheetProps) {
  const t = useTranslations('products')
  const qc = useQueryClient()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (field: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const setImageFromFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return url })
  }, [])

  const removeImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setImageFile(null)
    setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setImageFromFile(file)
  }, [setImageFromFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImageFromFile(file)
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!form.nameEn.trim()) next.nameEn = t('validationNameEnRequired')
    if (!form.nameNe.trim()) next.nameNe = t('validationNameNeRequired')
    if (!form.priceB2c) {
      next.priceB2c = t('validationPriceRequired')
    } else if (isNaN(parseFloat(form.priceB2c)) || parseFloat(form.priceB2c) < 0) {
      next.priceB2c = t('validationPricePositive')
    }
    if (!form.priceB2b) {
      next.priceB2b = t('validationPriceRequired')
    } else if (isNaN(parseFloat(form.priceB2b)) || parseFloat(form.priceB2b) < 0) {
      next.priceB2b = t('validationPricePositive')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleClose = () => {
    if (isSubmitting) return
    setForm(EMPTY_FORM)
    setErrors({})
    setServerError(null)
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    onOpenChange(false)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setServerError(null)
    try {
      const res = await api.post<{ success: boolean; data: IProduct }>('/products', {
        name_en: form.nameEn.trim(),
        name_ne: form.nameNe.trim(),
        sku: form.sku.trim() || undefined,
        category: form.category || undefined,
        price_b2c: parsePaisa(form.priceB2c),
        price_b2b: parsePaisa(form.priceB2b),
        deposit_amount: form.deposit ? parsePaisa(form.deposit) : 0,
        reorder_level: parseInt(form.reorderLevel, 10) || 10,
      })

      const productId = res.data.data.id

      if (imageFile) {
        await api.post(`/products/${productId}/image`, imageFile, {
          headers: { 'Content-Type': imageFile.type },
        })
      }

      await qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('createSuccess'))
      handleClose()
    } catch {
      setServerError(t('failedToCreate'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = (field: keyof FormErrors) =>
    cn(
      'w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
      'transition-colors duration-150',
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
        : 'border-slate-200'
    )

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-6 py-5 border-b border-slate-200">
          <SheetTitle className="text-base font-semibold text-slate-900">
            {t('addProductTitle')}
          </SheetTitle>
        </SheetHeader>

        <form
          id="add-product-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto"
        >
          <div className="px-6 py-5 space-y-6">
            {serverError && (
              <div
                role="alert"
                className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            {/* Image upload */}
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-700">
                {t('image')}
              </span>
              <div
                role="button"
                tabIndex={0}
                aria-label={t('imagePlaceholder')}
                onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center h-44 rounded-lg border-2 border-dashed cursor-pointer',
                  'transition-colors duration-150',
                  isDragOver
                    ? 'border-primary bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-32 w-32 object-cover rounded-md border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      aria-label="Remove image"
                      className="absolute -top-2 -right-2 bg-white rounded-full border border-slate-200 p-0.5 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      <X className="w-3 h-3 text-slate-500" />
                    </button>
                    {imageFile && (
                      <p className="mt-2 text-xs text-slate-500 text-center max-w-[128px] truncate">
                        {imageFile.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2" aria-hidden="true" />
                    <p className="text-sm text-slate-600">{t('imagePlaceholder')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('imageHint')}</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Basic info */}
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {t('sectionBasic')}
              </p>

              <div className="space-y-1.5">
                <label htmlFor="nameEn" className="block text-sm font-medium text-slate-700">
                  {t('nameEnLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameEn"
                  value={form.nameEn}
                  onChange={set('nameEn')}
                  placeholder={t('nameEnPlaceholder')}
                  className={inputClass('nameEn')}
                />
                {errors.nameEn && (
                  <p className="text-xs text-red-600" role="alert">{errors.nameEn}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="nameNe" className="block text-sm font-medium text-slate-700">
                  {t('nameNe')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameNe"
                  value={form.nameNe}
                  onChange={set('nameNe')}
                  placeholder={t('nameNePlaceholder')}
                  className={inputClass('nameNe')}
                  style={{ fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif" }}
                />
                {errors.nameNe && (
                  <p className="text-xs text-red-600" role="alert">{errors.nameNe}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="sku" className="block text-sm font-medium text-slate-700">
                    {t('sku')}
                  </label>
                  <input
                    id="sku"
                    value={form.sku}
                    onChange={set('sku')}
                    placeholder={t('skuPlaceholder')}
                    className={inputClass('sku')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                    {t('category')}
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={set('category')}
                    className={cn(inputClass('category'), 'bg-white')}
                  >
                    <option value="">{t('selectCategory')}</option>
                    {Object.values(ProductCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`categories.${cat}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {t('sectionPricing')}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="priceB2c" className="block text-sm font-medium text-slate-700">
                    {t('priceB2cLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none font-mono">
                      रू
                    </span>
                    <input
                      id="priceB2c"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.priceB2c}
                      onChange={set('priceB2c')}
                      placeholder="0.00"
                      className={cn(inputClass('priceB2c'), 'pl-8 font-mono')}
                    />
                  </div>
                  {errors.priceB2c && (
                    <p className="text-xs text-red-600" role="alert">{errors.priceB2c}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="priceB2b" className="block text-sm font-medium text-slate-700">
                    {t('priceB2bLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none font-mono">
                      रू
                    </span>
                    <input
                      id="priceB2b"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.priceB2b}
                      onChange={set('priceB2b')}
                      placeholder="0.00"
                      className={cn(inputClass('priceB2b'), 'pl-8 font-mono')}
                    />
                  </div>
                  {errors.priceB2b && (
                    <p className="text-xs text-red-600" role="alert">{errors.priceB2b}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {t('sectionLogistics')}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="deposit" className="block text-sm font-medium text-slate-700">
                    {t('depositLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none font-mono">
                      रू
                    </span>
                    <input
                      id="deposit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.deposit}
                      onChange={set('deposit')}
                      placeholder="0.00"
                      className={cn(inputClass('deposit'), 'pl-8 font-mono')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reorderLevel" className="block text-sm font-medium text-slate-700">
                    {t('reorderLevelLabel')}
                  </label>
                  <input
                    id="reorderLevel"
                    type="number"
                    min="0"
                    value={form.reorderLevel}
                    onChange={set('reorderLevel')}
                    placeholder="10"
                    className={inputClass('reorderLevel')}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Fixed footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            form="add-product-form"
            disabled={isSubmitting}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white',
              'bg-accent hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              'transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? t('creating') : t('addProduct')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
