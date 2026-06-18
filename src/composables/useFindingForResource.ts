import { computed, type Ref } from 'vue'
import type { Finding } from '@/types/finding'

/**
 * Finds all findings that reference a given resource id
 *
 * Used to surface "findings about this thing" in any resource detail view
 */
export function useFindingsForResource(findings: Ref<readonly Finding[]>, resourceId: Ref<string>) {
  return computed(() => {
    const id = resourceId.value
    if (!id) return []
    return findings.value.filter((f) => f.resources.some((r) => r.resourceId === id))
  })
}
