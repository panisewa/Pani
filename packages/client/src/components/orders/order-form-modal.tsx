'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import type { ICustomer, IProduct, PaginatedResponse } from '@/lib/api-types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'

interface OrderItem {
  product_id: string
  quantity: number
}

interface Props {
  open: boolean
  onClose: () => void
}

const EMPTY_FORM = {
  customer_id: '',
  type: 'B2C' as 'B2C' | 'B2B',
  scheduled_date: '',
  payment_method: '' as '' | 'CASH' | 'ESEWA' | 'KHALTI' | 'CREDIT',
  notes: '',
}

export function OrderFormModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', quantity: 1 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setItems([{ product_id: '', quantity: 1 }])
      setError(null)
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
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    )

  const addItem = () =>
    setItems((prev) => [...prev, { product_id: '', quantity: 1 }])

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))

  const computeSubtotal = (): number => {
    return items.reduce((sum, it) => {
      const p = productMap.get(it.product_id)
      if (!p) return sum
      const price = form.type === 'B2B' ? p.priceB2b : p.priceB2c
      return sum + price * it.quantity + p.depositAmount * it.quantity
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.customer_id) { setError('Select a customer.'); return }
    const validItems = items.filter((it) => it.product_id && it.quantity > 0)
    if (validItems.length === 0) { setError('Add at least one product.'); return }

    const payload: Record<string, unknown> = {
      customer_id: form.customer_id,
      type: form.type,
      items: validItems,
    }
    if (form.scheduled_date) payload.scheduled_date = form.scheduled_date
    if (form.payment_method) payload.payment_method = form.payment_method
    if (form.notes) payload.notes = form.notes

    setLoading(true)
    try {
      await api.post('/orders', payload)
      await qc.invalidateQueries({ queryKey: ['orders'] })
      await qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message
      setError(msg ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
  const inputCls =
    'w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent'

  const subtotal = computeSubtotal()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Customer + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Customer *</label>
              <select
                className={inputCls}
                value={form.customer_id}
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value)
                  setForm((f) => ({
                    ...f,
                    customer_id: e.target.value,
                    type: cust?.type ?? f.type,
                  }))
                }}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Order Type</label>
              <div className="flex gap-2">
                {(['B2C', 'B2B'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      form.type === t
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <label className={labelCls}>Products *</label>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const p = productMap.get(item.product_id)
                const price = p ? (form.type === 'B2B' ? p.priceB2b : p.priceB2c) : 0
                return (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      className={`${inputCls} flex-1`}
                      value={item.product_id}
                      onChange={(e) => setItem(idx, 'product_id', e.target.value)}
                    >
                      <option value="">Select product…</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.nameEn} — {formatPaisa(form.type === 'B2B' ? prod.priceB2b : prod.priceB2c)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      className={`${inputCls} w-20 text-center`}
                      value={item.quantity}
                      onChange={(e) => setItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    {p && (
                      <span className="text-xs text-slate-500 font-mono w-24 text-right shrink-0">
                        {formatPaisa(price * item.quantity)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add product
              </button>
            </div>

            {subtotal > 0 && (
              <div className="mt-3 flex justify-end">
                <div className="text-sm space-y-1 text-right">
                  <div className="text-slate-500">
                    Subtotal: <span className="font-mono text-slate-700">{formatPaisa(subtotal)}</span>
                  </div>
                  <div className="text-slate-500">
                    VAT (13%): <span className="font-mono text-slate-700">{formatPaisa(Math.round(subtotal * 1300 / 10000))}</span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    Total: <span className="font-mono">{formatPaisa(subtotal + Math.round(subtotal * 1300 / 10000))}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date + Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Scheduled Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.scheduled_date}
                onChange={(e) => set('scheduled_date', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Payment Method</label>
              <select
                className={inputCls}
                value={form.payment_method}
                onChange={(e) => set('payment_method', e.target.value as typeof form.payment_method)}
              >
                <option value="">Select…</option>
                <option value="CASH">Cash</option>
                <option value="ESEWA">eSewa</option>
                <option value="KHALTI">Khalti</option>
                <option value="CREDIT">Credit (B2B)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional delivery notes"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
