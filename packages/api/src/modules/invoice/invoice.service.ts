import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { InvoiceStatus, PaymentMethod } from '@panisewa/shared'
import { getFiscalYear, adToBs } from '@panisewa/shared'
import type { CreateInvoiceInput, MarkPaidInput, InvoiceFilterInput } from '@panisewa/shared'
import type { IInvoice, IAgingBucket } from './invoice.types.js'
import { notificationQueue, pdfQueue } from '../../lib/bullmq/queues.js'
import type { Database } from '../../types/supabase.types.js'

type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

const STORAGE_BUCKET = 'invoice-pdfs'

function toInvoice(row: Record<string, unknown>): IInvoice {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    invoiceNumber: row['invoice_number'] as string,
    orderId: row['order_id'] as string | null,
    customerId: row['customer_id'] as string,
    status: row['status'] as InvoiceStatus,
    subtotal: row['subtotal'] as number,
    vatRate: row['vat_rate'] as number,
    vatAmount: row['vat_amount'] as number,
    total: row['total'] as number,
    dueDate: row['due_date'] as string | null,
    paidAt: row['paid_at'] as string | null,
    paymentMethod: row['payment_method'] as PaymentMethod | null,
    pdfUrl: row['pdf_url'] as string | null,
    bsDate: row['bs_date'] as string | null,
    createdAt: row['created_at'] as string,
  }
}

export async function generateInvoiceNumber(tenantId: string, date: Date = new Date()): Promise<string> {
  const fiscalYearKey = getFiscalYear(date)

  const { data, error } = await supabaseAdmin.rpc('increment_invoice_sequence', {
    p_tenant_id: tenantId,
    p_fiscal_year_key: fiscalYearKey,
  })

  if (error) {
    const seq = Date.now() % 1000000
    return `INV-${fiscalYearKey}-${String(seq).padStart(6, '0')}`
  }

  return `INV-${fiscalYearKey}-${String(data).padStart(6, '0')}`
}

function bsDateDevanagari(date: Date): string {
  const bs = adToBs(date)
  const toDevanagari = (n: number, pad: number): string => {
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
    return String(n)
      .padStart(pad, '0')
      .split('')
      .map((d) => devanagariDigits[parseInt(d)] ?? d)
      .join('')
  }
  return `${toDevanagari(bs.year, 4)}-${toDevanagari(bs.month, 2)}-${toDevanagari(bs.day, 2)}`
}

export async function createInvoice(
  tenantId: string,
  input: CreateInvoiceInput
): Promise<IInvoice> {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) throw new AppError('TENANT_NOT_FOUND', 404)

  const settings = (tenant as Record<string, unknown>)['settings'] as Record<string, unknown>
  const vatRegistered = settings['vatRegistered'] === true

  let subtotal = 0
  let vatAmount = 0
  let total = 0
  const VAT_RATE = 1300

  if (input.order_id) {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('subtotal, vat_amount, total, customer_id')
      .eq('id', input.order_id)
      .eq('tenant_id', tenantId)
      .single()

    if (orderError || !order) throw new AppError('ORDER_NOT_FOUND', 404, { orderId: input.order_id })

    const o = order as Record<string, unknown>
    subtotal = o['subtotal'] as number
    vatAmount = vatRegistered ? (o['vat_amount'] as number) : 0
    total = subtotal + vatAmount
  } else {
    subtotal = 0
    vatAmount = 0
    total = 0
  }

  const now = new Date()
  const invoiceNumber = await generateInvoiceNumber(tenantId, now)
  const bsDate = bsDateDevanagari(now)

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      order_id: input.order_id ?? null,
      customer_id: input.customer_id,
      status: InvoiceStatus.DRAFT,
      subtotal,
      vat_rate: vatRegistered ? VAT_RATE : 0,
      vat_amount: vatAmount,
      total,
      due_date: input.due_date ?? null,
      bs_date: bsDate,
    })
    .select('*')
    .single()

  if (error || !data) throw new AppError('INVOICE_CREATE_FAILED', 500)
  return toInvoice(data as Record<string, unknown>)
}

export async function getInvoices(
  tenantId: string,
  filters: InvoiceFilterInput
): Promise<{ invoices: IInvoice[]; total: number }> {
  const { status, customer_id, from, to, page, limit } = filters
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('invoices')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (customer_id) query = query.eq('customer_id', customer_id)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error, count } = await query
  if (error) throw new AppError('INVOICES_FETCH_FAILED', 500)

  return {
    invoices: (data as Record<string, unknown>[]).map(toInvoice),
    total: count ?? 0,
  }
}

export async function getInvoiceById(tenantId: string, invoiceId: string): Promise<IInvoice> {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) throw new AppError('INVOICE_NOT_FOUND', 404, { invoiceId })
  return toInvoice(data as Record<string, unknown>)
}

export async function generatePDF(invoiceId: string, tenantId: string): Promise<void> {
  await pdfQueue.add('generate-invoice-pdf', { invoiceId, tenantId })
}

export async function sendInvoice(tenantId: string, invoiceId: string): Promise<IInvoice> {
  const invoice = await getInvoiceById(tenantId, invoiceId)

  if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
    throw new AppError('INVOICE_NOT_SENDABLE', 409, { status: invoice.status })
  }

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update({ status: InvoiceStatus.SENT })
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('INVOICE_NOT_FOUND', 404, { invoiceId })

  await notificationQueue.add('invoice-sms', {
    tenantId,
    invoiceId,
    customerId: invoice.customerId,
    pdfUrl: invoice.pdfUrl,
  })

  return toInvoice(data as Record<string, unknown>)
}

export async function markPaid(
  tenantId: string,
  invoiceId: string,
  input: MarkPaidInput
): Promise<IInvoice> {
  const invoice = await getInvoiceById(tenantId, invoiceId)
  if (invoice.status === InvoiceStatus.PAID) {
    throw new AppError('INVOICE_ALREADY_PAID', 409, { invoiceId })
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new AppError('INVOICE_CANCELLED', 409, { invoiceId })
  }

  const update: InvoiceUpdate = {
    status: InvoiceStatus.PAID,
    payment_method: input.payment_method,
    paid_at: input.paid_at ?? new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update(update)
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single()

  if (error || !data) throw new AppError('INVOICE_NOT_FOUND', 404, { invoiceId })
  return toInvoice(data as Record<string, unknown>)
}

export async function markOverdueInvoices(tenantId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update({ status: InvoiceStatus.OVERDUE })
    .eq('tenant_id', tenantId)
    .in('status', [InvoiceStatus.DRAFT, InvoiceStatus.SENT])
    .lt('due_date', today)
    .select('id')

  if (error) throw new AppError('INVOICE_UPDATE_FAILED', 500)
  return (data as unknown[]).length
}

export async function getOverdueInvoices(tenantId: string): Promise<IInvoice[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', [InvoiceStatus.SENT, InvoiceStatus.OVERDUE])
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw new AppError('INVOICES_FETCH_FAILED', 500)
  return (data as Record<string, unknown>[]).map(toInvoice)
}

export async function getAgingReport(tenantId: string): Promise<IAgingBucket[]> {
  const today = new Date()

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', [InvoiceStatus.SENT, InvoiceStatus.OVERDUE])
    .not('due_date', 'is', null)

  if (error) throw new AppError('INVOICES_FETCH_FAILED', 500)

  const invoices = (data as Record<string, unknown>[]).map(toInvoice)

  const buckets: IAgingBucket[] = [
    { bucket: '0-30', count: 0, totalAmount: 0, invoices: [] },
    { bucket: '31-60', count: 0, totalAmount: 0, invoices: [] },
    { bucket: '61-90', count: 0, totalAmount: 0, invoices: [] },
    { bucket: '90+', count: 0, totalAmount: 0, invoices: [] },
  ]

  for (const inv of invoices) {
    if (!inv.dueDate) continue
    const daysOverdue = Math.floor(
      (today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    let bucket: IAgingBucket
    if (daysOverdue <= 30) bucket = buckets[0]!
    else if (daysOverdue <= 60) bucket = buckets[1]!
    else if (daysOverdue <= 90) bucket = buckets[2]!
    else bucket = buckets[3]!

    bucket.count++
    bucket.totalAmount += inv.total
    bucket.invoices.push(inv)
  }

  return buckets
}

export async function updateInvoicePdfUrl(
  invoiceId: string,
  pdfUrl: string
): Promise<void> {
  await supabaseAdmin
    .from('invoices')
    .update({ pdf_url: pdfUrl })
    .eq('id', invoiceId)
}
