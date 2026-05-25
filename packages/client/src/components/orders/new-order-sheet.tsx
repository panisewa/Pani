'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { ICustomer, IProduct, PaginatedResponse } from '@/lib/api-types'

interface OrderItem {
  product_id: string
  quantity: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_FORM = {
  customer_id: '',
  type: 'B2C' as 'B2C' | 'B2B',
  scheduled_date: '',
  payment_method: '' as '' | 'CASH' | 'ESEWA' | 'KHALTI' | 'CREDIT',
  notes: '',
}

const VAT_BASIS_POINTS = 1300

export function NewOrderSheet({ open, onOpenChange }: Props) {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const qc = useQueryClient()

  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', quantity: 1 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<'customer' | 'items', string>>>({})

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setItems([{ product_id: '', quantity: 1 }])
      setErrors({})
    }
  }, [open])

  const { data: customersData } = useQuery<PaginatedResponse<ICustomer>>({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<ICustomer>>('/customers?limit=100&is_active=true')
      return res.data
    },
    enabled: open,
  })

  const { data: productsData } = useQuery<PaginatedResponse<IProduct>>({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<IProduct>>('/products?limit=100')
      return res.data
    },
    enabled: open,
  })

  const customers = customersData?.data ?? []
  const products = productsData?.data ?? []
  const productMap = new Map(products.map((p) => [p.id, p]))

  const set = (field: keyof typeof EMPTY_FORM, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const setItem = (idx: number, field: keyof OrderItem, value: string | number) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))

  const addItem = () => setItems((prev) => [...prev, { product_id: '', quantity: 1 }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const subtotal = items.reduce((sum, it) => {
    const p = productMap.get(it.product_id)
    if (!p) return sum
    const price = form.type === 'B2B' ? p.priceB2b : p.priceB2c
    return sum + (price + p.depositAmount) * it.quantity
  }, 0)

  const vat = Math.round((subtotal * VAT_BASIS_POINTS) / 10000)
  const total = subtotal + vat

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.customer_id) errs.customer = t('errorSelectCustomer')
    const validItems = items.filter((it) => it.product_id && it.quantity > 0)
    if (validItems.length === 0) errs.items = t('errorAddProduct')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const validItems = items.filter((it) => it.product_id && it.quantity > 0)
      const payload: Record<string, unknown> = {
        customer_id: form.customer_id,
        type: form.type,
        items: validItems,
      }
      if (form.scheduled_date) payload.scheduled_date = form.scheduled_date
      if (form.payment_method) payload.payment_method = form.payment_method
      if (form.notes.trim()) payload.notes = form.notes.trim()

      await api.post('/orders', payload)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['orders'] }),
        qc.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        qc.invalidateQueries({ queryKey: ['dashboard-orders'] }),
      ])
      toast.success(t('createSuccess'))
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message
      toast.error(msg ?? t('failedToCreate'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-slate-400'

  const errorInputCls =
    'w-full px-3 py-2 rounded-md border border-red-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-colors placeholder:text-slate-400'

  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl flex flex-col p-0" side="right">
        <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0">
          <SheetTitle className="text-base font-semibold text-slate-900">
            {t('newOrder')}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Customer + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  {t('customer')} <span className="text-accent normal-case font-normal tracking-normal">*</span>
                </label>
                <select
                  className={errors.customer ? errorInputCls : inputCls}
                  value={form.customer_id}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value)
                    setForm((f) => ({
                      ...f,
                      customer_id: e.target.value,
                      type: cust?.type ?? f.type,
                    }))
                    if (errors.customer) setErrors((prev) => ({ ...prev, customer: undefined }))
                  }}
                >
                  <option value="">{t('selectCustomer')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
                {errors.customer && (
                  <p className="mt-1 text-xs text-red-600">{errors.customer}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>{t('orderTypeLabel')}</label>
                <div className="flex gap-1.5">
                  {(['B2C', 'B2B'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('type', type)}
                      className={`flex-1 py-2 rounded-md text-sm font-semibold border transition-colors ${
                        form.type === type
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <label className={labelCls}>
                {t('addProduct')} <span className="text-accent normal-case font-normal tracking-normal">*</span>
              </label>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const p = productMap.get(item.product_id)
                  const linePrice = p
                    ? (form.type === 'B2B' ? p.priceB2b : p.priceB2c) * item.quantity
                    : 0
                  return (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        className={`${errors.items && !item.product_id ? errorInputCls : inputCls} flex-1`}
                        value={item.product_id}
                        onChange={(e) => {
                          setItem(idx, 'product_id', e.target.value)
                          if (errors.items) setErrors((prev) => ({ ...prev, items: undefined }))
                        }}
                      >
                        <option value="">{t('selectProduct')}</option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.nameEn}{' '}
                            {formatPaisa(form.type === 'B2B' ? prod.priceB2b : prod.priceB2c)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        aria-label={t('quantity')}
                        className={`${inputCls} w-16 text-center`}
                        value={item.quantity}
                        onChange={(e) => setItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      />
                      {p && linePrice > 0 && (
                        <span className="text-xs text-slate-500 font-mono w-20 text-right shrink-0 tabular-nums">
                          {formatPaisa(linePrice)}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={t('removeItem')}
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
                {errors.items && (
                  <p className="text-xs text-red-600">{errors.items}</p>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('addProduct')}
                </button>
              </div>

              {/* Order total summary */}
              {subtotal > 0 && (
                <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t('subtotal')}</span>
                    <span className="font-mono tabular-nums">{formatPaisa(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{t('vat')}</span>
                    <span className="font-mono tabular-nums">{formatPaisa(vat)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>{t('total')}</span>
                    <span className="font-mono tabular-nums">{formatPaisa(total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Date + Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('scheduledDate')}</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.scheduled_date}
                  onChange={(e) => set('scheduled_date', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>{t('paymentMethod')}</label>
                <select
                  className={inputCls}
                  value={form.payment_method}
                  onChange={(e) =>
                    set('payment_method', e.target.value as typeof form.payment_method)
                  }
                >
                  <option value="">{t('selectPayment')}</option>
                  <option value="CASH">{t('paymentMethods.CASH')}</option>
                  <option value="ESEWA">{t('paymentMethods.ESEWA')}</option>
                  <option value="KHALTI">{t('paymentMethods.KHALTI')}</option>
                  <option value="CREDIT">{t('paymentMethods.CREDIT')}</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>
                {t('notes')}{' '}
                <span className="normal-case font-normal tracking-normal text-slate-400">
                  ({tCommon('optional')})
                </span>
              </label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={2}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder={t('notesPlaceholder')}
              />
            </div>
          </div>

          {/* Fixed footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-md bg-accent text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('creating') : t('createOrder')}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
