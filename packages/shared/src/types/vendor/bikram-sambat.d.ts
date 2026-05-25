declare module 'bikram-sambat' {
  interface BsDate {
    year: number
    month: number
    day: number
  }

  interface DevDate {
    year: string
    month: string
    day: string
  }

  /** Convert Gregorian date string "YYYY-MM-DD" to BS {year, month, day} */
  function toBik(gregDate: string): BsDate
  /** Convert BS {year, month, day} to Gregorian {year, month, day} */
  function toGreg(year: number, month: number, day: number): BsDate
  /** Convert BS {year, month, day} to Gregorian "YYYY-MM-DD" string */
  function toGreg_text(year: number, month: number, day: number): string
  /** Convert Gregorian date string to BS Devanagari {year, month, day} */
  function toBik_dev(gregDate: string): DevDate
  /** Convert Gregorian date string to BS "YYYY-MM-DD" ASCII string */
  function toBik_euro(gregDate: string): string
  /** Convert Gregorian date string to BS full text representation */
  function toBik_text(gregDate: string): string
  /** Convert BS {year, month, day} to Devanagari {year, month, day} */
  function toDev(year: number, month: number, day: number): DevDate
  /** Number of days in a given BS year/month */
  function daysInMonth(year: number, month: number): number

  export { toBik, toGreg, toGreg_text, toBik_dev, toBik_euro, toBik_text, toDev, daysInMonth }
}
