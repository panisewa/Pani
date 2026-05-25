'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { formatPaisa } from '@panisewa/shared'
import { OrderStatus } from '@panisewa/shared'
import { toast } from 'sonner'
import { ArrowRight, AlertCircle, XCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { IOrder, SingleResponse } from '@/lib/api-types'

interface Driver {
  id: string
  firstName: string
  lastName: string
}

interface Props {
  orderId: string | null
  onOpenChange: (open: boolean) => void
}

const PIPELINE: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.CONFIRMED,
  OrderStatus.ASSIGNED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
]

const TERMINAL = new Set<OrderStatus>([OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED])
const EDITABLE = new Set<OrderStatus>([OrderStatus.DRAFT, OrderStatus.CONFIRMED])
const CANCELLABLE = new Set<OrderStatus>([OrderStatus.DRAFT, OrderStatus.CONFIRMED, OrderStatus.ASSIGNED])

function parseAmendments(notes: string | null): { date: string; text: string }[] {
  if (!notes) return []
  return notes
    .split('\n')
    .map((line) => {
      const m = line.match(/^\[(\d{4}-\d{2}-\d{2})\] (.+)$/)
      return m ? { date: m[1]!, text: m[2]! } : null
    })
    .filter((x): x is { date: string; text: string } => x !== null)
    .reverse()
}

function deliveryNotesOnly(notes: string | null): string {
  if (!notes) return ''
  return notes
    .split('\n')
    .filter((l) => !/^\[\d{4}-\d{2}-\d{2}\]/.test(l))
    .join('\n')
    .trim()
}

export function OrderDetailSheet({ orderId, onOpenChange }: Props) {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const qc = useQueryClient()

  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [amendmentNote, setAmendmentNote] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [emptiesCollected, setEmptiesCollected] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const open = orderId !== null

  const { data, isLoading, isError } = useQuery<SingleResponse<IOrder>>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await api.get<SingleResponse<IOrder>>(`/orders/${orderId}`)
      return res.data
    },
    enabled: !!orderId,
  })

  const order = data?.data

  const { data: driversData } = useQuery<{ success: boolean; data: Driver[] }>({
    queryKey: ['drivers-list'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Driver[] }>('/orders/drivers')
      return res.data
    },
    enabled: open && order?.status === OrderStatus.CONFIRMED,
    staleTime: 60_000,
  })
  const drivers = driversData?.data ?? []

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['orders'] }),
      qc.invalidateQueries({ queryKey: ['order', orderId] }),
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      qc.invalidateQueries({ queryKey: ['dashboard-orders'] }),
    ])
  }

  const handleAdvanceStatus = async () => {
    if (!order) return
    setIsSaving(true)
    try {
      switch (order.status) {
        case OrderStatus.DRAFT:
          await api.post(`/orders/${orderId}/confirm`, {})
          break
        case OrderStatus.CONFIRMED:
          if (!selectedDriverId) { toast.error('Select a driver first'); setIsSaving(false); return }
          await api.post(`/orders/${orderId}/assign-driver`, { driver_id: selectedDriverId })
          setSelectedDriverId('')
          break
        case OrderStatus.ASSIGNED:
          await api.post(`/orders/${orderId}/out-for-delivery`, {})
          break
        case OrderStatus.OUT_FOR_DELIVERY:
          await api.post(`/orders/${orderId}/deliver`, { empties_collected: emptiesCollected })
          setEmptiesCollected(0)
          break
        default:
          setIsSaving(false)
          return
      }
      await invalidate()
      toast.success(t('statusAdvanced'))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message
      toast.error(msg ?? t('failedToUpdate'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkFailed = async () => {
    setIsSaving(true)
    try {
      await api.post(`/orders/${orderId}/fail`, {})
      await invalidate()
      toast.success(t('statusAdvanced'))
    } catch {
      toast.error(t('failedToUpdate'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    setIsSaving(true)
    try {
      await api.post(`/orders/${orderId}/cancel`, {})
      await invalidate()
      toast.success(t('statusAdvanced'))
      setCancelConfirm(false)
    } catch {
      toast.error(t('failedToUpdate'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!order) return
    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      if (scheduledDate !== (order.scheduledDate ?? '')) payload.scheduled_date = scheduledDate || null
      if (paymentMethod !== (order.paymentMethod ?? '')) payload.payment_method = paymentMethod || null
      if (Object.keys(payload).length === 0) { setEditMode(false); setIsSaving(false); return }
      await api.patch(`/orders/${orderId}`, payload)
      await invalidate()
      toast.success(t('editSaved'))
      setEditMode(false)
    } catch {
      toast.error(t('failedToUpdate'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddAmendment = async () => {
    if (!amendmentNote.trim() || !order) return
    setIsSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]!
      const newLine = `[${today}] ${amendmentNote.trim()}`
      const existing = order.notes ?? ''
      const updated = existing ? `${newLine}\n${existing}` : newLine
      await api.patch(`/orders/${orderId}`, { notes: updated })
      await invalidate()
      toast.success(t('amendmentSaved'))
      setAmendmentNote('')
    } catch {
      toast.error(t('failedToUpdate'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setCancelConfirm(false)
    setEditMode(false)
    setAmendmentNote('')
    setSelectedDriverId('')
    setEmptiesCollected(0)
  }

  const inputCls =
    'w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-slate-400'
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'

  const pipelineIdx = order ? PIPELINE.indexOf(order.status) : 0

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <SheetContent className="sm:max-w-lg flex flex-col p-0" side="right">
        <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0">
          <SheetTitle className="text-base font-semibold text-slate-900">
            {t('detail')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-slate-100 rounded animate-pulse"
                  style={{ width: `${60 + (i % 3) * 15}%` }}
                />
              ))}
            </div>
          ) : isError || !order ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600">{t('failedToLoadDetail')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Order header */}
              <div className="px-6 py-4 space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                  {t('orderNumber')}
                </p>
                <p className="font-mono font-bold text-slate-900 text-lg leading-tight">
                  {order.orderNumber}
                </p>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      order.type === 'B2B'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    {order.type}
                  </span>
                  {order.customerName && (
                    <span className="text-sm text-slate-600">{order.customerName}</span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Status pipeline */}
              <div className="px-6 py-4">
                {order.status === OrderStatus.CANCELLED ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{t('statusLabels.CANCELLED')}</span>
                  </div>
                ) : order.status === OrderStatus.FAILED ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('statusLabels.FAILED')}</span>
                  </div>
                ) : (
                  <div className="flex items-start">
                    {PIPELINE.map((s, idx) => (
                      <React.Fragment key={s}>
                        {idx > 0 && (
                          <div
                            className={`flex-1 h-0.5 mt-3 ${idx <= pipelineIdx ? 'bg-primary' : 'bg-slate-200'}`}
                          />
                        )}
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx < pipelineIdx
                                ? 'bg-primary text-white'
                                : idx === pipelineIdx
                                ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {idx < pipelineIdx ? '✓' : idx + 1}
                          </div>
                          <p
                            className={`text-[9px] mt-1 max-w-[48px] text-center leading-tight ${
                              idx === pipelineIdx
                                ? 'text-primary font-semibold'
                                : idx < pipelineIdx
                                ? 'text-slate-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {t(`statusLabels.${s}` as Parameters<typeof t>[0])}
                          </p>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              {/* Financials */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-3 gap-px bg-slate-100 rounded-lg overflow-hidden">
                  {[
                    { label: t('subtotal'), value: formatPaisa(order.subtotal) },
                    { label: t('vat'),      value: formatPaisa(order.vatAmount) },
                    { label: t('total'),    value: formatPaisa(order.total) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white px-3 py-2.5">
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {label}
                      </p>
                      <p className="font-mono text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {!TERMINAL.has(order.status) && (
                <div className="px-6 py-4 space-y-2">
                  {/* Driver selector for CONFIRMED → ASSIGNED */}
                  {order.status === OrderStatus.CONFIRMED && (
                    <div className="mb-1">
                      <label className={labelCls}>{t('assignDriver')}</label>
                      <select
                        className={inputCls}
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                      >
                        <option value="">{t('selectDriver')}</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.firstName} {d.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Empties collected for OUT_FOR_DELIVERY → DELIVERED */}
                  {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                    <div className="mb-1">
                      <label className={labelCls}>{t('emptiesCollected')}</label>
                      <input
                        type="number"
                        min="0"
                        className={inputCls}
                        value={emptiesCollected}
                        onChange={(e) => setEmptiesCollected(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  {/* Primary advance button */}
                  {order.status !== OrderStatus.DELIVERED && (
                    <button
                      disabled={isSaving || (order.status === OrderStatus.CONFIRMED && !selectedDriverId)}
                      onClick={handleAdvanceStatus}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      {order.status === OrderStatus.DRAFT && t('actions.confirm')}
                      {order.status === OrderStatus.CONFIRMED && t('actions.assign')}
                      {order.status === OrderStatus.ASSIGNED && t('actions.startDelivery')}
                      {order.status === OrderStatus.OUT_FOR_DELIVERY && t('actions.markDelivered')}
                    </button>
                  )}

                  {/* Mark Failed (OUT_FOR_DELIVERY only) */}
                  {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                    <button
                      disabled={isSaving}
                      onClick={handleMarkFailed}
                      className="w-full px-4 py-2.5 rounded-md border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {t('actions.markFailed')}
                    </button>
                  )}

                  {/* Cancel */}
                  {CANCELLABLE.has(order.status) && (
                    cancelConfirm ? (
                      <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-2">
                        <p className="text-xs text-red-700 font-medium">{t('actions.cancelConfirm')}</p>
                        <div className="flex gap-2">
                          <button
                            disabled={isSaving}
                            onClick={handleCancel}
                            className="flex-1 py-1.5 rounded-md bg-red-600 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                          >
                            {t('actions.confirmYes')}
                          </button>
                          <button
                            onClick={() => setCancelConfirm(false)}
                            className="flex-1 py-1.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            {t('actions.confirmNo')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelConfirm(true)}
                        className="w-full px-4 py-2 rounded-md text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {t('actions.cancel')}
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Editable fields */}
              {EDITABLE.has(order.status) && (
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={labelCls}>{t('editFields')}</p>
                    {!editMode && (
                      <button
                        onClick={() => {
                          setScheduledDate(order.scheduledDate ?? '')
                          setPaymentMethod(order.paymentMethod ?? '')
                          setEditMode(true)
                        }}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        {tCommon('edit')}
                      </button>
                    )}
                  </div>

                  {editMode ? (
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>{t('scheduledDate')}</label>
                        <input
                          type="date"
                          className={inputCls}
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>{t('paymentMethod')}</label>
                        <select
                          className={inputCls}
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="">{t('selectPayment')}</option>
                          <option value="CASH">{t('paymentMethods.CASH')}</option>
                          <option value="ESEWA">{t('paymentMethods.ESEWA')}</option>
                          <option value="KHALTI">{t('paymentMethods.KHALTI')}</option>
                          <option value="CREDIT">{t('paymentMethods.CREDIT')}</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditMode(false)}
                          className="flex-1 py-2 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {tCommon('cancel')}
                        </button>
                        <button
                          disabled={isSaving}
                          onClick={handleSaveEdit}
                          className="flex-1 py-2 rounded-md bg-primary text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
                        >
                          {isSaving ? tCommon('saving') : tCommon('save')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                          {t('scheduledDate')}
                        </p>
                        <p className="text-sm text-slate-700 mt-0.5">
                          {order.scheduledDate
                            ? new Date(order.scheduledDate).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })
                            : <span className="text-slate-400">—</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                          {t('paymentMethod')}
                        </p>
                        <p className="text-sm text-slate-700 mt-0.5">
                          {order.paymentMethod
                            ? t(`paymentMethods.${order.paymentMethod}` as Parameters<typeof t>[0])
                            : <span className="text-slate-400">—</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div className="px-6 py-4">
                  <p className={`${labelCls} mb-3`}>{t('orderItems')}</p>
                  <div className="space-y-2.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 truncate">{item.productNameEn}</p>
                          <p
                            className="text-xs text-slate-500 mt-0.5"
                            style={{ fontFamily: "'Noto Sans Devanagari', system-ui" }}
                          >
                            {item.productNameNe}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400 tabular-nums">
                            {item.quantity} × {formatPaisa(item.unitPrice)}
                          </p>
                          <p className="font-mono text-sm font-medium text-slate-900 tabular-nums mt-0.5">
                            {formatPaisa(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amendments */}
              <div className="px-6 py-4 space-y-3">
                <p className={labelCls}>{t('amendments')}</p>

                {!TERMINAL.has(order.status) && (
                  <div className="space-y-2">
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={2}
                      value={amendmentNote}
                      onChange={(e) => setAmendmentNote(e.target.value)}
                      placeholder={t('amendmentPlaceholder')}
                    />
                    <button
                      disabled={!amendmentNote.trim() || isSaving}
                      onClick={handleAddAmendment}
                      className="px-3 py-1.5 rounded-md bg-slate-900 text-xs font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSaving ? t('savingAmendment') : t('addAmendment')}
                    </button>
                  </div>
                )}

                {(() => {
                  const amendments = parseAmendments(order.notes)
                  if (amendments.length === 0) {
                    return <p className="text-xs text-slate-400 italic">{t('noAmendments')}</p>
                  }
                  return (
                    <div className="space-y-2.5">
                      {amendments.map(({ date, text }, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 font-mono">{date}</p>
                            <p className="text-sm text-slate-700 mt-0.5">{text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {(() => {
                  const plain = deliveryNotesOnly(order.notes)
                  if (!plain) return null
                  return (
                    <div className="mt-2 pt-3 border-t border-slate-100">
                      <p className={`${labelCls} mb-1`}>{t('notes')}</p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{plain}</p>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
