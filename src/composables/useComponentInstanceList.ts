import { computed, ref, type Ref } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { instanceMeta } from '@/utils/instanceMeta'
import type { ComponentInstance } from '@/types/component'

const FILTER_THRESHOLD = 1

export function useComponentInstanceList(instances: Ref<ComponentInstance[]>) {
  const systemStore = useSystemStore()
  const { contextForInstance } = useInstanceContext()
  const search = ref('')

  function systemInstanceName(id: string): string | undefined {
    return systemStore.systemInstances.find((si) => si.systemInstanceId === id)?.displayName
  }

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return instances.value
    return instances.value.filter((i) => {
      const m = instanceMeta(i)
      return (
        i.displayName.toLowerCase().includes(q) ||
        i.componentInstanceId.toLowerCase().includes(q) ||
        (systemInstanceName(i.systemInstance) ?? '').toLowerCase().includes(q) ||
        (contextForInstance(i).name ?? '').toLowerCase().includes(q) ||
        (m.namespace ?? '').toLowerCase().includes(q)
      )
    })
  })

  const showFilter = computed(() => instances.value.length >= FILTER_THRESHOLD)

  return {
    search,
    filtered,
    showFilter,
    systemInstanceName,
    contextForInstance,
    meta: instanceMeta,
  }
}
