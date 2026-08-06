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

  const instancesBySystem = computed(() => {
    const map = new Map<string, SystemInstance[]>()
    for (const inst of systemInstances.value) {
      const list = map.get(inst.system) ?? []
      list.push(inst)
      map.set(inst.system, list)
    }
    return map
  })

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
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      systems.value = await fetchSystems()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
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
    if (instancesLoaded.value || instancesLoading.value) return
    instancesLoading.value = true
    try {
      const list = await fetchSystemInstances()
      systemInstances.value = await Promise.all(
        list.map((i) => fetchSystemInstanceById(i.systemInstanceId).catch(() => i)),
      )
      instancesLoaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      instancesLoading.value = false
    }
  }

  async function loadSystemInstanceDetail(id: string): Promise<void> {
    selectedInstanceDetail.value = null
    try {
      selectedInstanceDetail.value = await fetchSystemInstanceById(id)
    } catch {
      selectedInstanceDetail.value = null
    }
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
