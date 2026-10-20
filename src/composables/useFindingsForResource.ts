import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Finding } from '@/types/finding'

/**
 * Finds all findings that reference a given resource id, or any of several
 * ids (e.g. a resource together with its instances). Order follows the
 * findings list, a finding referencing several of the ids appears once
 *
 * Used to surface "findings about this thing" in any resource detail view
 */
export function useFindingsForResource(
  findings: MaybeRefOrGetter<readonly Finding[]>,
  resourceId: MaybeRefOrGetter<string | readonly string[]>,
) {
  return computed(() => {
    const raw = toValue(resourceId)
    const ids = new Set((typeof raw === 'string' ? [raw] : raw).filter(Boolean))
    if (ids.size === 0) return []
    return toValue(findings).filter((f) => f.resources.some((r) => ids.has(r.resourceId)))
  })
}
