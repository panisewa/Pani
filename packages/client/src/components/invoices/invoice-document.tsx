import { formatPaisa } from '@panisewa/shared'
import type { IInvoice, ITenant } from '@/lib/api-types'

export type DocumentType = 'TAX_INVOICE' | 'QUOTATION' | 'RECEIPT'

const DOC_META: Record<DocumentType, { en: string; ne: string; en_sub: string }> = {
  TAX_INVOICE: { en: 'TAX INVOICE',     ne: 'कर बिजक',       en_sub: 'VAT Invoice' },
  QUOTATION:   { en: 'QUOTATION',       ne: 'मूल्य अनुमान',  en_sub: 'Price Estimate' },
  RECEIPT:     { en: 'RECEIPT',         ne: 'भरपाई',         en_sub: 'Payment Receipt' },
}

const NE_FONT = "'Noto Sans Devanagari', 'Mukta', system-ui, sans-serif"
const MONO    = "'JetBrains Mono', 'Courier New', monospace"

interface Props {
  invoice: IInvoice
  tenant: ITenant
  documentType: DocumentType
}

export function InvoiceDocument({ invoice, tenant, documentType }: Props) {
  const doc = DOC_META[documentType]
  const vatPct = Math.round((invoice.vatRate ?? 1300) / 100)

  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const createdStr = new Date(invoice.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div
      id="invoice-print-area"
      className="w-full bg-white text-slate-900"
      style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px' }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ padding: '28px 36px 20px', borderBottom: '2px solid #0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          {/* Company info */}
          <div>
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a', lineHeight: 1.2 }}>
              {tenant.name}
            </p>
            {tenant.settings?.address && (
              <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>
                {tenant.settings.address}
              </p>
            )}
            {tenant.settings?.phone && (
              <p style={{ color: '#475569', fontSize: '12px' }}>
                फोन / Phone: {tenant.settings.phone}
              </p>
            )}
            {tenant.settings?.panNumber && (
              <p style={{ color: '#475569', fontSize: '12px' }}>
                PAN: <span style={{ fontFamily: MONO }}>{tenant.settings.panNumber}</span>
                {tenant.settings?.vatRegistered && (
                  <span style={{ marginLeft: '8px', color: '#16A34A', fontWeight: 600 }}>
                    • VAT Registered
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Document type */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: NE_FONT, fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
              {doc.ne}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
              {doc.en}
            </p>
            <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
              {doc.en_sub}
            </p>
          </div>
        </div>
      </div>

      {/* ── Invoice metadata + Bill-to ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderBottom: '1px solid #E2E8F0' }}>
        {/* Invoice info */}
        <div style={{ padding: '18px 36px', borderRight: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            बिल विवरण / Invoice Details
          </p>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#475569', paddingBottom: '5px', paddingRight: '12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  बिल नं. / Invoice No.:
                </td>
                <td style={{ fontFamily: MONO, fontWeight: 600, paddingBottom: '5px' }}>
                  {invoice.invoiceNumber}
                </td>
              </tr>
              {invoice.bsDate && (
                <tr>
                  <td style={{ color: '#475569', paddingBottom: '5px', paddingRight: '12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                    मिति (बि.स.):
                  </td>
                  <td style={{ fontFamily: NE_FONT, paddingBottom: '5px' }}>
                    {invoice.bsDate}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ color: '#475569', paddingBottom: '5px', paddingRight: '12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  मिति / Date:
                </td>
                <td style={{ paddingBottom: '5px' }}>{createdStr}</td>
              </tr>
              {dueDateStr && (
                <tr>
                  <td style={{ color: '#475569', paddingBottom: '5px', paddingRight: '12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                    भुक्तान मिति / Due:
                  </td>
                  <td style={{ paddingBottom: '5px', color: invoice.status === 'OVERDUE' ? '#DC2626' : undefined }}>
                    {dueDateStr}
                  </td>
                </tr>
              )}
              {invoice.orderId && (
                <tr>
                  <td style={{ color: '#475569', paddingBottom: '5px', paddingRight: '12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                    Order Ref.:
                  </td>
                  <td style={{ fontFamily: MONO, fontSize: '11px', color: '#475569', paddingBottom: '5px' }}>
                    {invoice.orderId.slice(0, 8).toUpperCase()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bill to */}
        <div style={{ padding: '18px 36px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            ग्राहक / Bill To
          </p>
          {invoice.customerName ? (
            <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{invoice.customerName}</p>
          ) : (
            <p style={{ color: '#94A3B8', fontSize: '11px', fontStyle: 'italic' }}>
              Customer ID: {invoice.customerId.slice(0, 8).toUpperCase()}
            </p>
          )}
          {invoice.customerAddress?.street && (
            <p style={{ color: '#475569', fontSize: '12px', marginTop: '3px' }}>{invoice.customerAddress.street}</p>
          )}
          {(invoice.customerAddress?.city || invoice.customerAddress?.district) && (
            <p style={{ color: '#475569', fontSize: '12px' }}>
              {[invoice.customerAddress.city, invoice.customerAddress.district].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* ── Line items ─────────────────────────────────────────── */}
      <div style={{ padding: '20px 36px' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0f172a' }}>
              <th style={{ textAlign: 'center', padding: '6px 8px 8px 0', fontWeight: 600, width: '36px' }}>
                क्र.सं.
              </th>
              <th style={{ textAlign: 'left', padding: '6px 8px 8px', fontWeight: 600 }}>
                विवरण / Description
              </th>
              <th style={{ textAlign: 'center', padding: '6px 8px 8px', fontWeight: 600, width: '60px' }}>
                मात्रा
              </th>
              <th style={{ textAlign: 'right', padding: '6px 8px 8px', fontWeight: 600, width: '100px' }}>
                दर / Rate
              </th>
              <th style={{ textAlign: 'right', padding: '6px 0 8px 8px', fontWeight: 600, width: '110px' }}>
                रकम / Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ textAlign: 'center', padding: '9px 8px 9px 0', fontFamily: MONO, color: '#94A3B8', fontSize: '11px' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '9px 8px' }}>
                    <p style={{ fontWeight: 500, marginBottom: '1px' }}>{item.productNameEn}</p>
                    <p style={{ fontFamily: NE_FONT, fontSize: '11px', color: '#475569' }}>{item.productNameNe}</p>
                    {item.depositAmount > 0 && (
                      <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>
                        + deposit {formatPaisa(item.depositAmount * item.quantity)}
                      </p>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '9px 8px', fontFamily: MONO }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '9px 8px', fontFamily: MONO }}>{formatPaisa(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right', padding: '9px 0 9px 8px', fontFamily: MONO, fontWeight: 500 }}>
                    {formatPaisa(item.subtotal)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', padding: '32px 8px', color: '#94A3B8', fontSize: '11px', fontStyle: 'italic', borderBottom: '1px solid #E2E8F0' }}
                >
                  Line item details not available in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Totals ─────────────────────────────────────────────── */}
      <div style={{ padding: '0 36px 24px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #E2E8F0' }}>
            <span style={{ color: '#475569' }}>उप-जम्मा / Subtotal</span>
            <span style={{ fontFamily: MONO }}>{formatPaisa(invoice.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid #E2E8F0' }}>
            <span style={{ color: '#475569' }}>मू.अ.कर ({vatPct}%) / VAT</span>
            <span style={{ fontFamily: MONO }}>{formatPaisa(invoice.vatAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 0', borderTop: '2px solid #0f172a', marginTop: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>जम्मा / Total</span>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '15px' }}>{formatPaisa(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* ── Signatures ─────────────────────────────────────────── */}
      <div style={{ margin: '0 36px', padding: '20px 0 24px', borderTop: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <div style={{ borderBottom: '1px solid #475569', marginBottom: '6px', paddingBottom: '32px' }} />
          <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
            अधिकृत हस्ताक्षर / Authorized Signature
          </p>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{tenant.name}</p>
        </div>
        <div>
          <div style={{ borderBottom: '1px solid #475569', marginBottom: '6px', paddingBottom: '32px' }} />
          <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
            ग्राहकको हस्ताक्षर / Customer Signature
          </p>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            {invoice.customerName ?? 'ग्राहक'}
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ padding: '12px 36px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.6 }}>
          यो {doc.ne} कम्प्युटरद्वारा उत्पन्न गरिएको हो। / This is a computer generated {doc.en.toLowerCase()}.
          {tenant.settings?.vatRegistered && (
            <> • VAT Registration confirmed under Inland Revenue Department, Nepal.</>
          )}
        </p>
        {tenant.settings?.panNumber && (
          <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', fontFamily: MONO }}>
            PAN: {tenant.settings.panNumber}
          </p>
        )}
      </div>
    </div>
  )
}
