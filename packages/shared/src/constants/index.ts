/** VAT rate in basis points: 13.00% = 1300 */
export const VAT_RATE = 1300

/** Nepal mobile number: starts with 97 or 98, 10 digits total */
export const NEPAL_PHONE_REGEX = /^(97|98)\d{8}$/

export const PLAN_LIMITS = {
  starter: {
    users: 5,
    productsPerMonth: 50,
    storageGb: 1,
  },
  growth: {
    users: 25,
    productsPerMonth: 500,
    storageGb: 10,
  },
  enterprise: {
    users: Infinity,
    productsPerMonth: Infinity,
    storageGb: 100,
  },
} as const

export const ORDER_NUMBER_PREFIX = 'ORD'
export const INVOICE_NUMBER_PREFIX = 'INV'

/** Basis points divisor for percentage display */
export const BASIS_POINTS = 10_000
