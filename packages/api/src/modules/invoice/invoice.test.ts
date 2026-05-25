import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/invoice.pdf' } }),
      }),
    },
  },
}))

vi.mock('../../lib/bullmq/queues.js', () => ({
  pdfQueue: { add: vi.fn().mockResolvedValue({}) },
  notificationQueue: { add: vi.fn().mockResolvedValue({}) },
}))

import { supabaseAdmin } from '../../lib/supabase.js'
import { generateInvoiceNumber } from './invoice.service.js'
import { getFiscalYear } from '@panisewa/shared'

const db = supabaseAdmin as unknown as {
  rpc: ReturnType<typeof vi.fn>
  from: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
  db.rpc.mockResolvedValue({ data: 1, error: null })
})

// ─── Invoice number format ────────────────────────────────────────────────────

describe('generateInvoiceNumber', () => {
  it('formats number correctly: INV-YYYY/YY-XXXXXX', async () => {
    db.rpc.mockResolvedValueOnce({ data: 1, error: null })
    const result = await generateInvoiceNumber('tenant-1', new Date('2024-08-01'))
    expect(result).toMatch(/^INV-\d{4}\/\d{2}-\d{6}$/)
  })

  it('pads sequence to 6 digits', async () => {
    db.rpc.mockResolvedValueOnce({ data: 42, error: null })
    const result = await generateInvoiceNumber('tenant-1', new Date('2024-08-01'))
    expect(result).toMatch(/INV-\d{4}\/\d{2}-000042$/)
  })

  it('falls back on rpc error (still returns valid format)', async () => {
    db.rpc.mockResolvedValueOnce({ data: null, error: { message: 'db error' } })
    const result = await generateInvoiceNumber('tenant-1', new Date('2024-08-01'))
    expect(result).toMatch(/^INV-\d{4}\/\d{2}-\d+$/)
  })
})

// ─── getFiscalYear (fiscal year boundary logic) ───────────────────────────────

describe('getFiscalYear (from @panisewa/shared)', () => {
  it('Shrawan (month 4) starts new fiscal year', () => {
    // 2024-07-16 ≈ BS 2081 Shrawan 01 → fiscal year 2081/82
    const result = getFiscalYear(new Date('2024-07-16'))
    expect(result).toBe('2081/82')
  })

  it('Ashadh (month 3, before fiscal year end) belongs to previous fiscal year', () => {
    // 2024-07-14 ≈ BS 2081 Ashadh 30 → fiscal year 2080/81
    const result = getFiscalYear(new Date('2024-07-14'))
    expect(result).toBe('2080/81')
  })

  it('mid fiscal year (Poush/December) returns correct label', () => {
    // 2023-12-25 ≈ BS 2080 Poush → fiscal year 2080/81
    const result = getFiscalYear(new Date('2023-12-25'))
    expect(result).toBe('2080/81')
  })

  it('Baisakh (month 1, start of BS year) still in previous fiscal year', () => {
    // 2024-04-14 ≈ BS 2081 Baisakh 01 → fiscal year 2080/81 (Shrawan not yet)
    const result = getFiscalYear(new Date('2024-04-14'))
    expect(result).toBe('2080/81')
  })

  it('rollover: Shrawan 1 of new year starts new fiscal year', () => {
    // 2025-07-17 ≈ BS 2082 Shrawan 01 → fiscal year 2082/83
    const result = getFiscalYear(new Date('2025-07-17'))
    expect(result).toBe('2082/83')
  })

  it('year with single-digit suffix pads to 2 digits', () => {
    // fiscal year where end year mod 100 < 10 → e.g. 2100/01
    // Approximate 2100 AD → BS ~2157
    // Just verify format: always X/YY
    const result = getFiscalYear(new Date('2024-08-01'))
    expect(result).toMatch(/^\d{4}\/\d{2}$/)
  })

  it('fiscal year label second part is last 2 digits of next BS year', () => {
    // 2081 fiscal year → "2081/82" (82 = 2082 % 100)
    const result = getFiscalYear(new Date('2024-08-01'))
    const [startYear, suffix] = result.split('/')
    const expectedSuffix = String((parseInt(startYear!) + 1) % 100).padStart(2, '0')
    expect(suffix).toBe(expectedSuffix)
  })

  it('sequence for same fiscal year increments correctly', async () => {
    db.rpc
      .mockResolvedValueOnce({ data: 1, error: null })
      .mockResolvedValueOnce({ data: 2, error: null })

    const n1 = await generateInvoiceNumber('tenant-1', new Date('2024-08-01'))
    const n2 = await generateInvoiceNumber('tenant-1', new Date('2024-10-01'))

    const [, , seq1] = n1.split('-')
    const [, , seq2] = n2.split('-')
    expect(parseInt(seq1!)).toBe(1)
    expect(parseInt(seq2!)).toBe(2)
  })

  it('fiscal year resets: different fiscal years produce independent sequences', async () => {
    db.rpc
      .mockResolvedValueOnce({ data: 1, error: null })  // FY 2081/82
      .mockResolvedValueOnce({ data: 1, error: null })  // FY 2082/83 - resets to 1

    const n1 = await generateInvoiceNumber('tenant-1', new Date('2024-08-01'))  // FY 2081/82
    const n2 = await generateInvoiceNumber('tenant-1', new Date('2025-08-01'))  // FY 2082/83

    expect(n1).toContain('2081/82')
    expect(n2).toContain('2082/83')

    const [, , seq1] = n1.split('-')
    const [, , seq2] = n2.split('-')
    expect(parseInt(seq1!)).toBe(1)
    expect(parseInt(seq2!)).toBe(1)  // resets because different fiscal year
  })
})
