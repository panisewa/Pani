import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { markPaid } from '../invoice/invoice.service.js'
import { PaymentMethod } from '@panisewa/shared'

const KHALTI_SECRET_KEY = process.env['KHALTI_SECRET_KEY'] ?? ''
const KHALTI_API_URL = 'https://a.khalti.com/api/v2'

async function khaltiPost(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${KHALTI_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new AppError('KHALTI_API_ERROR', 502, { detail: text })
  }

  return res.json() as Promise<Record<string, unknown>>
}

export interface KhaltiPaymentResponse {
  pidx: string
  payment_url: string
  expires_at: string
}

export async function initiateKhalti(
  tenantId: string,
  invoiceId: string,
  returnUrl: string
): Promise<KhaltiPaymentResponse> {
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select('total, invoice_number')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !invoice) throw new AppError('INVOICE_NOT_FOUND', 404, { invoiceId })

  const inv = invoice as Record<string, unknown>
  const totalPaisa = inv['total'] as number
  const invoiceNumber = inv['invoice_number'] as string

  const response = await khaltiPost('/epayment/initiate/', {
    return_url: returnUrl,
    website_url: process.env['FRONTEND_URL'] ?? 'https://panisewa.com',
    amount: totalPaisa,
    purchase_order_id: invoiceId,
    purchase_order_name: invoiceNumber,
  })

  if (!response['pidx'] || !response['payment_url']) {
    throw new AppError('KHALTI_INITIATE_FAILED', 502)
  }

  return {
    pidx: response['pidx'] as string,
    payment_url: response['payment_url'] as string,
    expires_at: response['expires_at'] as string,
  }
}

export async function verifyKhalti(tenantId: string, pidx: string): Promise<void> {
  const response = await khaltiPost('/epayment/lookup/', { pidx })

  const status = response['status'] as string
  if (status !== 'Completed') {
    throw new AppError('KHALTI_PAYMENT_INCOMPLETE', 402, { status })
  }

  const invoiceId = response['purchase_order_id'] as string
  if (!invoiceId) throw new AppError('KHALTI_INVALID_RESPONSE', 400)

  await markPaid(tenantId, invoiceId, {
    payment_method: PaymentMethod.KHALTI,
    paid_at: new Date().toISOString(),
  })
}
