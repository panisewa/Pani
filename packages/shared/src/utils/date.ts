import { toBik, toBik_euro, toGreg_text } from 'bikram-sambat'

const toIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Convert AD Date to BS date string in ASCII e.g. "2081-03-15" */
export const adToBsAscii = (date: Date): string => toBik_euro(toIso(date))

/** Convert AD Date to BS {year, month, day} */
export const adToBs = (date: Date): { year: number; month: number; day: number } =>
  toBik(toIso(date))

/** Convert BS {year, month, day} to AD "YYYY-MM-DD" string */
export const bsToAdAscii = (year: number, month: number, day: number): string =>
  toGreg_text(year, month, day)

/** Get current Nepali fiscal year label e.g. "2081/82" */
export const getFiscalYear = (date: Date = new Date()): string => {
  const bs = toBik(toIso(date))
  // Fiscal year starts Shrawan (month 4). If month < 4 → fiscal year started prev year.
  const fiscalStart = bs.month >= 4 ? bs.year : bs.year - 1
  const fiscalEnd = (fiscalStart + 1) % 100
  return `${fiscalStart}/${fiscalEnd.toString().padStart(2, '0')}`
}
