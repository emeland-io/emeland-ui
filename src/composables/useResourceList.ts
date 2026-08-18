import { computed, watch, type ComputedRef, type Ref } from 'vue'
import { matchesQuery } from '@/utils/search'

/**
 * Keep the selection valid as the filtered list changes: clear it when the
 * list empties, select the first row when the current id is filtered away.
 */
export function useAutoSelectFirst<T>(
  list: Ref<T[]> | ComputedRef<T[]>,
  idOf: (item: T) => string,
  selectedId: Ref<string>,
  select: (id: string) => void,
): void {
  watch(
    list,
    (items) => {
      if (items.length === 0) {
        selectedId.value = ''
      } else if (!items.some((item) => idOf(item) === selectedId.value)) {
        select(idOf(items[0]))
      }
    },
    { immediate: true },
  )
}

/**
 * Ids whose searchable fields contain the query — used to highlight and focus
 * graph nodes while typing. Queries shorter than 2 characters match nothing.
 */
export function useSearchMatches<T>(
  search: Ref<string>,
  items: () => T[],
  idOf: (item: T) => string,
  fields: (item: T) => (string | undefined)[],
): ComputedRef<Set<string>> {
  return computed(() => {
    const q = search.value.trim().toLowerCase()
    if (q.length < 2) return new Set<string>()
    return new Set(
      items()
        .filter((item) => matchesQuery(q, ...fields(item)))
        .map(idOf),
    )
  })
}
