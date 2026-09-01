/** Normalize an unknown caught value */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  try {
    // stringify yields undefined for undefined/functions/symbols
    const s = JSON.stringify(e)
    if (s !== undefined) return s
  } catch {
    // fall through
  }
  try {
    return String(e)
  } catch {
    return 'unknown error'
  }
}

/**
 * Log a caught error (with stack, when present) and return the
 * normalized message
 */
export function reportError(context: string, e: unknown): string {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, e)
  return errorMessage(e)
}
