import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchSystems,
  fetchSystemById,
  fetchSystemInstances,
  fetchSystemInstanceById,
} from '@/api/systems'
import type { System, SystemInstance } from '@/types/system'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'
import { loadOnce, loadDetailRef, groupBy } from './support'

export const useSystemStore = defineStore('system', () => {
  const systems = ref<System[]>([])
  const systemInstances = ref<SystemInstance[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const instancesLoading = ref(false)
  const instancesLoaded = ref(false)
  const selectedInstanceDetail = ref<SystemInstance | null>(null)
  const detailsHydrated = ref(false)

  const errs = useResourceErrors()

  const systemMap = computed(() => new Map(systems.value.map((s) => [s.systemId, s])))

  const systemInstanceMap = computed(
    () => new Map(systemInstances.value.map((si) => [si.systemInstanceId, si])),
  )

  const instancesBySystem = computed(() => groupBy(systemInstances.value, (i) => i.system))

  function getParentName(s: System): string | undefined {
    if (!s.parent) return undefined
    return systemMap.value.get(s.parent)?.displayName
  }

  function isParentUnresolved(s: System): boolean {
    return !!s.parent && !systemMap.value.has(s.parent)
  }

  function getInstancesForSystem(id: string): SystemInstance[] {
    return instancesBySystem.value.get(id) ?? []
  }

  // Instances without a resolvable parent system
  const unmappedInstances = computed(() =>
    systemInstances.value.filter((i) => !i.system || !systemMap.value.has(i.system)),
  )

  function getKindForSystem(s: System): string {
    return s.abstract ? 'Abstract' : 'Concrete'
  }

  async function load() {
    await loadOnce(
      { loading, loaded, error },
      async () => {
        systems.value = await fetchSystems()
      },
      { resetError: true },
    )
  }

  async function loadSystemDetail(id: string): Promise<void> {
    await loadDetailInto(
      id,
      fetchSystemById,
      (full) => {
        systems.value = systems.value.map((s) => (s.systemId === id ? full : s))
      },
      errs,
    )
  }

  async function loadAllDetails(): Promise<void> {
    if (detailsHydrated.value) return
    try {
      const full = await Promise.all(
        systems.value.map((s) => fetchSystemById(s.systemId).catch(() => s)),
      )
      systems.value = full
      detailsHydrated.value = true
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function loadSystemInstances(): Promise<void> {
    await loadOnce({ loading: instancesLoading, loaded: instancesLoaded, error }, async () => {
      const list = await fetchSystemInstances()
      systemInstances.value = await Promise.all(
        list.map((i) => fetchSystemInstanceById(i.systemInstanceId).catch(() => i)),
      )
    })
  }

  async function loadSystemInstanceDetail(id: string): Promise<void> {
    await loadDetailRef(selectedInstanceDetail, () => fetchSystemInstanceById(id))
  }

  return {
    systems,
    systemInstances,
    loading,
    loaded,
    error,
    instancesLoading,
    instancesLoaded,
    selectedInstanceDetail,
    detailsHydrated,
    systemMap,
    systemInstanceMap,
    instancesBySystem,
    unmappedInstances,
    getParentName,
    isParentUnresolved,
    getInstancesForSystem,
    getKindForSystem,
    hasDetailError: errs.hasDetailError,
    load,
    loadSystemDetail,
    loadAllDetails,
    loadSystemInstances,
    loadSystemInstanceDetail,
  }
})
