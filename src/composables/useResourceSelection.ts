import { computed, ref, watch } from 'vue'
import { useSelectQuery } from '@/composables/useResourceNav'
import { useAutoSelectFirst } from '@/composables/useResourceList'

/**
 * Selection cluster of the resource views: the selected id, the selected item,
 * ?select= query preselection, auto-selecting the first visible row and
 * loading the detail whenever the selection changes
 */
export function useResourceSelection<T>(options: {
  /** all loaded items (for query preselection and the selected-item lookup) */
  items: () => T[]
  /** the visible, filtered rows (for auto-selecting the first row) */
  filtered: () => T[]
  idOf: (item: T) => string
  loadDetail?: (id: string) => void | Promise<unknown>
  /** extra hook on explicit selection (e.g. expanding ancestors in a tree) */
  onSelect?: (id: string) => void
}) {
  const { items, filtered, idOf, loadDetail, onSelect } = options

  const selectedId = ref('')
  const selected = computed(() => items().find((item) => idOf(item) === selectedId.value))

  function select(id: string) {
    selectedId.value = id
    if (id) onSelect?.(id)
  }

  useSelectQuery(
    selectedId,
    computed(() => items()),
    idOf,
  )

  useAutoSelectFirst(
    computed(() => filtered()),
    idOf,
    selectedId,
    select,
  )

  if (loadDetail) {
    watch(selectedId, (id) => {
      if (id) void loadDetail(id)
    })
  }

  return { selectedId, selected, select }
}
