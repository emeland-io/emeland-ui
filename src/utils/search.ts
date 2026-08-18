/**
 * Case-insensitive substring match over the given fields: An empty query
 * matches everything, so filters can use it without an explicit guard
 */
export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => (f ?? '').toLowerCase().includes(q))
}

/**
 * Case-insensitive substring match over annotation keys and values:
 * An empty query matches everything
 */
export function matchesAnnotations(
  query: string,
  annotations: Record<string, string> | undefined,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return Object.entries(annotations ?? {}).some(
    ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
  )
}
