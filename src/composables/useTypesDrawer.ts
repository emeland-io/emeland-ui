import { computed, ref } from 'vue'
import { useListKeyboardNav } from './useListKeyboardNav'

export interface TypesDrawerOptions<T> {
  /** loaded type list from the store */
  types: () => T[]
  idOf: (t: T) => string
  /** hydrated detail of the selected type, when the store has one */
  detail: () => T | null | undefined
  load: () => Promise<void>
  loadDetail: (id: string) => void
  /** type of the resource currently selected in the view, preselected on open */
  currentTypeId: () => string | undefined
}

export function useTypesDrawer<T>(options: TypesDrawerOptions<T>) {
  const open = ref(false)
  const selectedTypeId = ref('')

  const selectedType = computed(() => {
    const detail = options.detail()
    if (detail && options.idOf(detail) === selectedTypeId.value) return detail
    return options.types().find((t) => options.idOf(t) === selectedTypeId.value)
  })

  function select(id: string) {
    selectedTypeId.value = id
    if (id) options.loadDetail(id)
  }

  async function openDrawer() {
    open.value = true
    await options.load()
    const current = options.currentTypeId()
    if (current && options.types().some((t) => options.idOf(t) === current)) {
      select(current)
    } else if (!selectedTypeId.value && options.types().length > 0) {
      select(options.idOf(options.types()[0]))
    }
  }

  async function openType(id: string) {
    open.value = true
    await options.load()
    if (options.types().some((t) => options.idOf(t) === id)) {
      select(id)
    }
  }

  function close() {
    open.value = false
  }

  useListKeyboardNav(
    computed(() => options.types().map(options.idOf)),
    selectedTypeId,
    select,
    computed(() => !open.value),
  )

  return { open, selectedTypeId, selectedType, select, openDrawer, openType, close }
}
