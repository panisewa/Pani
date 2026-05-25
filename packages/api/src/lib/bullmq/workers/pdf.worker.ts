import { Worker } from 'bullmq'
import { redis } from '../../redis.js'
import { supabaseAdmin } from '../../supabase.js'
import { updateInvoicePdfUrl } from '../../../modules/invoice/invoice.service.js'

const STORAGE_BUCKET = 'invoice-pdfs'

function buildInvoiceHtml(invoice: Record<string, unknown>, tenant: Record<string, unknown>, customer: Record<string, unknown>): string {
  const invoiceNumber = invoice['invoice_number'] as string
  const bsDate = invoice['bs_date'] as string ?? ''
  const subtotal = ((invoice['subtotal'] as number) / 100).toFixed(2)
  const vatAmount = ((invoice['vat_amount'] as number) / 100).toFixed(2)
  const total = ((invoice['total'] as number) / 100).toFixed(2)
  const vatRate = ((invoice['vat_rate'] as number) / 100).toFixed(0)
  const tenantName = tenant['name'] as string
  const settings = tenant['settings'] as Record<string, unknown>
  const panNumber = settings['panNumber'] as string ?? ''
  const customerName = customer['name'] as string
  const customerPhone = customer['phone'] as string ?? ''

  return `<!DOCTYPE html>
<html lang="ne">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; }
  h1 { font-size: 20px; text-align: center; }
  .header { text-align: center; margin-bottom: 20px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; }
  th { background: #f5f5f5; }
  .totals td { font-weight: bold; }
  .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #666; }
</style>
</head>
<body>
  <div class="header">
    <h1>${tenantName}</h1>
    ${panNumber ? `<p>PAN: ${panNumber}</p>` : ''}
    <h2>TAX INVOICE / कर रसिद</h2>
  </div>
  <div class="meta">
    <div>
      <strong>Invoice No:</strong> ${invoiceNumber}<br>
      <strong>Date (BS):</strong> ${bsDate}
    </div>
    <div>
      <strong>Bill To:</strong><br>
      ${customerName}<br>
      ${customerPhone}
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Description</th><th>Amount (NPR)</th></tr>
    </thead>
    <tbody>
      <tr><td>Services</td><td style="text-align:right">${subtotal}</td></tr>
    </tbody>
  </table>
  <table style="margin-top:10px; width:300px; margin-left:auto">
    <tr><td>Subtotal</td><td style="text-align:right">NPR ${subtotal}</td></tr>
    <tr><td>VAT (${vatRate}%)</td><td style="text-align:right">NPR ${vatAmount}</td></tr>
    <tr class="totals"><td>Total</td><td style="text-align:right">NPR ${total}</td></tr>
  </table>
  <div class="footer">
    This is a computer generated invoice. | यो कम्प्युटरद्वारा उत्पन्न रसिद हो।
  </div>
</body>
</html>`
}

export const pdfWorker = new Worker(
  'pdf-generation',
  async (job) => {
    const { invoiceId, tenantId } = job.data as { invoiceId: string; tenantId: string }

    const [invoiceRes, tenantRes] = await Promise.all([
      supabaseAdmin
        .from('invoices')
        .select('*, customers(*)')
        .eq('id', invoiceId)
        .single(),
      supabaseAdmin
        .from('tenants')
        .select('name, settings')
        .eq('id', tenantId)
        .single(),
    ])

    if (invoiceRes.error || !invoiceRes.data) {
      throw new Error(`Invoice ${invoiceId} not found`)
    }
    if (tenantRes.error || !tenantRes.data) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const invoiceRow = invoiceRes.data as Record<string, unknown>
    const tenantRow = tenantRes.data as Record<string, unknown>
    const customerRow = (invoiceRow['customers'] ?? {}) as Record<string, unknown>

    const html = buildInvoiceHtml(invoiceRow, tenantRow, customerRow)

    // Dynamic import so puppeteer only loads in worker context
    const { default: puppeteer } = await import('puppeteer')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })

      const path = `${tenantId}/${invoiceId}.pdf`
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true })

      if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`)

      const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      await updateInvoicePdfUrl(invoiceId, urlData.publicUrl)
    } finally {
      await browser.close()
    }
  },
  { connection: redis }
)
