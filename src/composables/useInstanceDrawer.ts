import { computed, ref, watch, type Ref } from 'vue'
import { scrollRowIntoView } from '@/composables/useListKeyboardNav'

export function useInstanceDrawer<TInst>(options: {
  /** every loaded instance */
  instances: () => TInst[]
  instanceId: (inst: TInst) => string
  /** the instance's parent resource id */
  instanceParent: (inst: TInst) => string | undefined
  /** unmapped instances in display order (filtered) */
  unmappedOrderedIds: () => string[]
  /** the filtered unmapped set (membership test) */
  unmappedFiltered: () => TInst[]
  /** id of the selected resource */
  selectedId: Ref<string>
  /** instances belonging to a resource, in drawer nav order */
  instancesFor: (resourceId: string) => TInst[]
  /** id of the last visible resource row (nav-exit target) */
  lastResourceRowId: () => string | undefined
  selectResource: (id: string) => void
}) {
  const {
    instances,
    instanceId,
    instanceParent,
    unmappedOrderedIds,
    unmappedFiltered,
    selectedId,
    instancesFor,
    lastResourceRowId,
    selectResource,
  } = options

  const drawerOpen = ref(false)
  const selectedInstanceId = ref('')

  function openInstance(id: string) {
    selectedInstanceId.value = id
    drawerOpen.value = true
  }

  function openFirstUnmapped() {
    const first = unmappedOrderedIds()[0]
    if (first) openInstance(first)
  }

  const currentIsUnmapped = computed(() =>
    unmappedFiltered().some((i) => instanceId(i) === selectedInstanceId.value),
  )

  const drawerNavIds = computed(() => {
    const inst = instances().find((i) => instanceId(i) === selectedInstanceId.value)
    if (!inst) return []
    if (currentIsUnmapped.value) return unmappedOrderedIds()
    return instancesFor(instanceParent(inst) ?? '').map(instanceId)
  })

  function onDrawerNavExit(step: number) {
    if (step !== -1 || !currentIsUnmapped.value) return
    drawerOpen.value = false
    const last = lastResourceRowId()
    if (last) {
      selectResource(last)
      scrollRowIntoView(last)
    }
  }

  // graph cursor follows the drawer instance while it belongs to the selection
  const instanceCursor = ref('')

  const cursorInstanceIds = computed(() =>
    selectedId.value ? instancesFor(selectedId.value).map(instanceId) : [],
  )

  watch(selectedId, () => {
    instanceCursor.value = ''
  })

  watch(selectedInstanceId, (id) => {
    if (!drawerOpen.value) return
    const inst = instances().find((i) => instanceId(i) === id)
    instanceCursor.value = inst && instanceParent(inst) === selectedId.value ? id : ''
  })

  return {
    drawerOpen,
    selectedInstanceId,
    openInstance,
    openFirstUnmapped,
    currentIsUnmapped,
    drawerNavIds,
    onDrawerNavExit,
    instanceCursor,
    cursorInstanceIds,
  }
}
