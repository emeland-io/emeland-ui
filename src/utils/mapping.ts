/**
 * Mapping state of an instance's parent reference:
 * - `unmapped`: no parent reference at all (allowed by the model; triggers a finding)
 * - `unresolved`: references a parent resource that does not exist
 * - `undefined`: the parent reference resolves fine
 */
export type MappingState = 'unmapped' | 'unresolved'

export function mappingStateOf(
  parentId: string | undefined,
  parentExists: boolean,
): MappingState | undefined {
  if (!parentId) return 'unmapped'
  return parentExists ? undefined : 'unresolved'
}

export interface BrokenRefGroup<T> {
  /** the broken parent reference ('' when the item has none) */
  key: string
  label: string
  state: MappingState | undefined
  items: T[]
}

/**
 * Groups items by a reference, for the unmapped-instance sections in the
 * resource lists: one group per reference value, items with no reference at
 * all in a final group of their own.
 *
 * - `labelOf` may resolve the reference to a display name; unresolvable
 *   references fall back to their truncated id (full id is a tooltip away)
 * - `exists` tells whether the reference resolves; unresolved groups carry an
 *   'unresolved' mapping state, the no-reference group an 'unmapped' one
 */
export function groupByBrokenRef<T>(
  items: T[],
  refOf: (item: T) => string | undefined,
  noRefLabel: string,
  labelOf?: (key: string) => string | undefined,
  exists?: (key: string) => boolean,
): BrokenRefGroup<T>[] {
  const byRef = new Map<string, T[]>()
  for (const item of items) {
    const key = refOf(item) || ''
    byRef.set(key, [...(byRef.get(key) ?? []), item])
  }
  return [...byRef.entries()]
    .map(([key, groupItems]) => ({
      key,
      label: (key && labelOf?.(key)) || (key ? `${key.slice(0, 8)}…` : noRefLabel),
      state: mappingStateOf(key, exists?.(key) ?? false),
      items: groupItems,
    }))
    .sort((a, b) => (a.key === '' ? 1 : b.key === '' ? -1 : a.label.localeCompare(b.label)))
}
