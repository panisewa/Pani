/**
 * All monetary values stored as integer paisa (NPR × 100).
 * NPR 15.00 → 1500 paisa. Never use floats for money.
 */

export const formatPaisa = (paisa: number): string => {
  const rupees = (paisa / 100).toFixed(2)
  return `रू ${rupees}`
}

export const formatPaisaEn = (paisa: number): string => {
  const rupees = (paisa / 100).toFixed(2)
  return `NPR ${rupees}`
}

/** Convert rupees string input ("15.00" or "15") to paisa integer */
export const parsePaisa = (rupees: string | number): number => {
  const n = typeof rupees === 'string' ? parseFloat(rupees) : rupees
  if (isNaN(n)) throw new Error(`Invalid rupee amount: ${rupees}`)
  return Math.round(n * 100)
}

export const applyVat = (paisa: number, vatRateBasisPoints: number): number => {
  return Math.round(paisa * vatRateBasisPoints / 10_000)
}

export const totalWithVat = (paisa: number, vatRateBasisPoints: number): number => {
  return paisa + applyVat(paisa, vatRateBasisPoints)
}
