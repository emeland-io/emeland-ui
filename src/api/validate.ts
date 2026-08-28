import { z } from 'zod'

/** At most this many issues land in the error message; the rest are counted. */
const MAX_ISSUES_IN_MESSAGE = 3

/** A single validation failure (a zod issue or a hand-rolled boundary assertion). */
export interface ApiIssue {
  path: readonly PropertyKey[]
  message: string
}

/**
 * Thrown when an API response does not match its expected schema.
 * Carries all zod `issues` for diagnostics; the message summarizes the first
 * few as `path: problem` pairs so a malformed list cannot fill the UI with a
 * wall of text.
 */
export class ApiValidationError extends Error {
  readonly what: string
  readonly issues: readonly ApiIssue[]

  constructor(what: string, issues: readonly ApiIssue[]) {
    const shown = issues.slice(0, MAX_ISSUES_IN_MESSAGE)
    const rest = issues.length - shown.length
    const details =
      shown
        .map((i) => `${i.path.length ? i.path.map(String).join('.') : '(root)'}: ${i.message}`)
        .join('; ') + (rest > 0 ? `; …(+${rest} more)` : '')
    super(`Invalid response for ${what}: ${details}`)
    this.name = 'ApiValidationError'
    this.what = what
    this.issues = issues
  }
}

/** Validate a raw API response against a schema, throwing ApiValidationError on mismatch */
export function parseApiResponse<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    // eslint-disable-next-line no-console -- intentional dev-mode diagnostics
    if (import.meta.env.DEV) console.error(z.prettifyError(result.error))
    const issues: ApiIssue[] = result.error.issues.map((i) => ({
      path: i.path,
      message: i.message,
    }))
    throw new ApiValidationError(what, issues)
  }
  warnOnUnknownKeys(data, result.data, what)
  return result.data
}

/**
 * Dev-only tolerant-reader telemetry: warn when a response carries keys the
 * schema stripped (e.g. renamed or added backend fields), so contract drift
 * surfaces during development instead of silently defaulting to ''.
 * Logs key names only, never values.
 */
export function warnOnUnknownKeys(data: unknown, parsed: unknown, what: string): void {
  if (!import.meta.env.DEV) return
  if (!data || typeof data !== 'object' || Array.isArray(data)) return
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return
  // instanceId is the sanctioned id-fallback key (see requireResourceId);
  // schemas strip it, but it is not contract drift
  const unknown = Object.keys(data).filter((k) => k !== 'instanceId' && !(k in parsed))
  if (unknown.length) {
    // eslint-disable-next-line no-console -- intentional dev-mode diagnostics
    console.warn(`[api] unknown key(s) in ${what} response: ${unknown.join(', ')}`)
  }
}
