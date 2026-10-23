/**
 * Shared arithmetic for the linear value scales (drawer value scale,
 * instance distribution strip): the domain they span, where a number
 * sits on it, and how axis numbers are printed.
 */

export interface ScaleDomain {
  lo: number
  hi: number
}

/**
 * Domain spanning the given numbers: starts at 0 unless a number is
 * negative, ends 10 % past the largest one. Percent scales stop at 100,
 * whole-number inputs get a whole-number end, equal bounds widen by 1.
 * An empty input yields the unit domain 0–1 instead of infinities.
 */
export function scaleDomain(numbers: number[], unit?: string): ScaleDomain {
  if (numbers.length === 0) return { lo: 0, hi: 1 }
  const lo = Math.min(0, ...numbers)
  let hi = Math.max(...numbers)
  if (unit === '%' && hi <= 100) hi = 100
  else hi += (hi - lo) * 0.1
  if (numbers.every(Number.isInteger)) hi = Math.ceil(hi)
  if (hi === lo) hi = lo + 1
  return { lo, hi }
}

/** position of `n` on the domain in percent of the width, clamped to 0–100 */
export function scalePosition(n: number, { lo, hi }: ScaleDomain): number {
  return Math.min(100, Math.max(0, ((n - lo) / (hi - lo)) * 100))
}

/** axis number: integers as they are, anything else to 3 significant digits */
export function formatScaleNumber(n: number): string {
  return Number.isInteger(n) ? `${n}` : `${Number(n.toPrecision(3))}`
}
