import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Finding } from '@/types/finding'

/**
 * Finds all findings that reference a given resource id
 *
 * Used to surface "findings about this thing" in any resource detail view
 */
export function useFindingsForResource(
  findings: MaybeRefOrGetter<readonly Finding[]>,
  resourceId: MaybeRefOrGetter<string>,
) {
  return computed(() => {
    const id = toValue(resourceId)
    if (!id) return []
    return toValue(findings).filter((f) => f.resources.some((r) => r.resourceId === id))
  })
}
