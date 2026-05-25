import crypto from 'node:crypto'
import { supabaseAdmin } from '../../lib/supabase.js'
import { AppError } from '../../lib/errors.js'
import { markPaid } from '../invoice/invoice.service.js'
import { PaymentMethod } from '@panisewa/shared'

const ESEWA_PRODUCT_CODE = process.env['ESEWA_MERCHANT_CODE'] ?? ''
const ESEWA_SECRET_KEY = process.env['ESEWA_SECRET_KEY'] ?? ''
const ESEWA_PAYMENT_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'

function sign(message: string): string {
  return crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(message).digest('base64')
}

export interface EsewaPaymentParams {
  amount: string
  tax_amount: string
  total_amount: string
  transaction_uuid: string
  product_code: string
  product_service_charge: string
  product_delivery_charge: string
  success_url: string
  failure_url: string
  signed_field_names: string
  signature: string
  payment_url: string
}

export async function initiateEsewa(
  tenantId: string,
  invoiceId: string,
  successUrl: string,
  failureUrl: string
): Promise<EsewaPaymentParams> {
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select('total, vat_amount, subtotal, invoice_number')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !invoice) throw new AppError('INVOICE_NOT_FOUND', 404, { invoiceId })

  const inv = invoice as Record<string, unknown>
  const totalAmount = inv['total'] as number
  const vatAmount = inv['vat_amount'] as number
  const subtotal = (inv['subtotal'] as number) - vatAmount

  const transactionUuid = invoiceId
  const amountStr = (subtotal / 100).toFixed(2)
  const taxStr = (vatAmount / 100).toFixed(2)
  const totalStr = (totalAmount / 100).toFixed(2)

  const signedFields = 'total_amount,transaction_uuid,product_code'
  const message = `total_amount=${totalStr},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`
  const signature = sign(message)

  return {
    amount: amountStr,
    tax_amount: taxStr,
    total_amount: totalStr,
    transaction_uuid: transactionUuid,
    product_code: ESEWA_PRODUCT_CODE,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: signedFields,
    signature,
    payment_url: ESEWA_PAYMENT_URL,
  }
}

export async function verifyEsewa(
  tenantId: string,
  encodedData: string
): Promise<void> {
  let decoded: Record<string, string>
  try {
    decoded = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8')) as Record<string, string>
  } catch {
    throw new AppError('ESEWA_INVALID_RESPONSE', 400)
  }

  const { total_amount, transaction_uuid, product_code, signed_field_names, signature } = decoded

  if (!signed_field_names || !signature) throw new AppError('ESEWA_INVALID_RESPONSE', 400)

  const fields = signed_field_names.split(',')
  const message = fields
    .map((f) => `${f}=${decoded[f] ?? ''}`)
    .join(',')

  const expectedSig = sign(message)
  if (expectedSig !== signature) throw new AppError('ESEWA_SIGNATURE_MISMATCH', 401)

  if (product_code !== ESEWA_PRODUCT_CODE) throw new AppError('ESEWA_INVALID_MERCHANT', 401)

  const invoiceId = transaction_uuid
  if (!invoiceId) throw new AppError('ESEWA_INVALID_RESPONSE', 400)

  const totalPaisa = Math.round(parseFloat(total_amount ?? '0') * 100)
  if (totalPaisa <= 0) throw new AppError('ESEWA_INVALID_AMOUNT', 400)

  await markPaid(tenantId, invoiceId, {
    payment_method: PaymentMethod.ESEWA,
    paid_at: new Date().toISOString(),
  })
}
