import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchApis, fetchApiById, fetchApiInstances, fetchApiInstanceById } from '@/api/apis'
import type { Api, ApiInstance } from '@/types/api'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'

export const useApiStore = defineStore('api', () => {
  const apis = ref<Api[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const detailsHydrated = ref(false)
  const apiInstances = ref<ApiInstance[]>([])
  const instancesLoading = ref(false)
  const instancesLoaded = ref(false)

  const hydratedApis = new Set<string>()
  const inflightDetail = new Map<string, Promise<void>>()

  const errs = useResourceErrors()

  const apiMap = computed(() => new Map(apis.value.map((a) => [a.apiId, a])))

  function getApiName(id: string): string | undefined {
    return apiMap.value.get(id)?.displayName
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      apis.value = await fetchApis()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function loadApiDetail(id: string): Promise<void> {
    if (hydratedApis.has(id)) return
    const inflight = inflightDetail.get(id)
    if (inflight) return inflight

    const p = loadDetailInto(
      id,
      fetchApiById,
      (full) => {
        apis.value = apis.value.map((a) => (a.apiId === id ? full : a))
        hydratedApis.add(id)
      },
      errs,
    ).finally(() => inflightDetail.delete(id))

    inflightDetail.set(id, p)
    return p
  }

  async function loadAllDetails(): Promise<void> {
    if (detailsHydrated.value) return
    await Promise.all(apis.value.map((a) => loadApiDetail(a.apiId)))
    detailsHydrated.value = true
  }

  const instancesByApi = computed(() => {
    const map = new Map<string, ApiInstance[]>()
    for (const i of apiInstances.value) {
      if (!i.api) continue
      const list = map.get(i.api) ?? []
      list.push(i)
      map.set(i.api, list)
    }
    return map
  })

  function getInstancesForApi(apiId: string): ApiInstance[] {
    return instancesByApi.value.get(apiId) ?? []
  }

  // Instances without a parent API
  const unmappedInstances = computed(() =>
    apiInstances.value.filter((i) => !i.api || !apiMap.value.has(i.api)),
  )

  async function loadApiInstances(): Promise<void> {
    if (instancesLoaded.value || instancesLoading.value) return
    instancesLoading.value = true
    try {
      const list = await fetchApiInstances()
      // The list endpoint is minimal, so hydrate each instance by id
      apiInstances.value = await Promise.all(
        list.map((i) => fetchApiInstanceById(i.apiInstanceId).catch(() => i)),
      )
      instancesLoaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      instancesLoading.value = false
    }
  }

  return {
    apis,
    loading,
    loaded,
    error,
    detailsHydrated,
    apiInstances,
    instancesLoading,
    instancesLoaded,
    instancesByApi,
    getInstancesForApi,
    unmappedInstances,
    loadApiInstances,
    apiMap,
    getApiName,
    hasDetailError: errs.hasDetailError,
    load,
    loadApiDetail,
    loadAllDetails,
  }
})
