'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { parsePaisa, formatPaisa } from '@panisewa/shared'
import type { ICustomer } from '@/lib/api-types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
  customer?: ICustomer
}

const EMPTY_FORM = {
  type: 'B2C' as 'B2C' | 'B2B',
  name: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  district: '',
  credit_limit_nrs: '',
  credit_terms: '' as '' | 'net30' | 'net60' | 'net90',
  notes: '',
}

export function CustomerFormModal({ open, onClose, customer }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customer) {
      const addr = customer.address as Record<string, string> | null
      setForm({
        type: customer.type,
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        street: addr?.street ?? '',
        city: addr?.city ?? '',
        district: addr?.district ?? '',
        credit_limit_nrs: customer.creditLimit > 0
          ? String(customer.creditLimit / 100)
          : '',
        credit_terms: (customer.creditTerms as typeof EMPTY_FORM['credit_terms']) ?? '',
        notes: customer.notes ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [customer, open])

  const set = (field: keyof typeof EMPTY_FORM, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    const payload: Record<string, unknown> = {
      type: form.type,
      name: form.name.trim(),
    }
    if (form.phone) payload.phone = form.phone
    if (form.email) payload.email = form.email
    if (form.street || form.city || form.district) {
      payload.address = {
        street: form.street || undefined,
        city: form.city || undefined,
        district: form.district || undefined,
      }
    }
    if (form.type === 'B2B') {
      payload.credit_limit = form.credit_limit_nrs
        ? parsePaisa(form.credit_limit_nrs)
        : 0
      if (form.credit_terms) payload.credit_terms = form.credit_terms
    }
    if (form.notes) payload.notes = form.notes

    setLoading(true)
    try {
      if (customer) {
        await api.patch(`/customers/${customer.id}`, payload)
      } else {
        await api.post('/customers', payload)
      }
      await qc.invalidateQueries({ queryKey: ['customers'] })
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type */}
          <div>
            <label className={labelCls}>Customer Type</label>
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

          {/* Name */}
          <div>
            <label className={labelCls}>Name *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Customer or business name"
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="name@email.com"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelCls}>Address</label>
            <div className="space-y-2">
              <input
                className={inputCls}
                value={form.street}
                onChange={(e) => set('street', e.target.value)}
                placeholder="Street"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="City"
                />
                <input
                  className={inputCls}
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                  placeholder="District"
                />
              </div>
            </div>
          </div>

          {/* B2B fields */}
          {form.type === 'B2B' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Credit Limit (NPR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={form.credit_limit_nrs}
                  onChange={(e) => set('credit_limit_nrs', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelCls}>Credit Terms</label>
                <select
                  className={inputCls}
                  value={form.credit_terms}
                  onChange={(e) => set('credit_terms', e.target.value as typeof form.credit_terms)}
                >
                  <option value="">None</option>
                  <option value="net30">Net 30</option>
                  <option value="net60">Net 60</option>
                  <option value="net90">Net 90</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={inputCls}
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional notes"
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
              {loading ? 'Saving…' : customer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
