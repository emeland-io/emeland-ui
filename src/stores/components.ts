import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchComponents,
  fetchComponentById,
  fetchComponentInstances,
  fetchComponentInstanceById,
} from '@/api/components'
import type { Component, ComponentInstance } from '@/types/component'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'

export const useComponentStore = defineStore('component', () => {
  const components = ref<Component[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const detailsHydrated = ref(false)
  const componentInstances = ref<ComponentInstance[]>([])
  const instancesLoading = ref(false)
  const instancesLoaded = ref(false)

  const hydratedComponents = new Set<string>()
  const inflightDetail = new Map<string, Promise<void>>()

  const errs = useResourceErrors()

  const componentMap = computed(() => new Map(components.value.map((c) => [c.componentId, c])))

  const componentsBySystem = computed(() => {
    const map = new Map<string, Component[]>()
    for (const c of components.value) {
      const list = map.get(c.system) ?? []
      list.push(c)
      map.set(c.system, list)
    }
    return map
  })

  function getComponentsForSystem(systemId: string): Component[] {
    return componentsBySystem.value.get(systemId) ?? []
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      components.value = await fetchComponents()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function loadComponentDetail(id: string): Promise<void> {
    if (hydratedComponents.has(id)) return
    const inflight = inflightDetail.get(id)
    if (inflight) return inflight

    const p = loadDetailInto(
      id,
      fetchComponentById,
      (full) => {
        components.value = components.value.map((c) => (c.componentId === id ? full : c))
        hydratedComponents.add(id)
      },
      errs,
    ).finally(() => inflightDetail.delete(id))

    inflightDetail.set(id, p)
    return p
  }

  async function loadAllDetails(): Promise<void> {
    if (detailsHydrated.value) return
    await Promise.all(components.value.map((c) => loadComponentDetail(c.componentId)))
    detailsHydrated.value = true
  }

  const instancesByComponent = computed(() => {
    const map = new Map<string, ComponentInstance[]>()
    for (const ci of componentInstances.value) {
      const list = map.get(ci.component) ?? []
      list.push(ci)
      map.set(ci.component, list)
    }
    return map
  })

  function getInstancesForComponent(componentId: string): ComponentInstance[] {
    return instancesByComponent.value.get(componentId) ?? []
  }

  // Instances without a resolvable parent component
  const unmappedInstances = computed(() =>
    componentInstances.value.filter((i) => !i.component || !componentMap.value.has(i.component)),
  )

  async function loadComponentInstances(): Promise<void> {
    if (instancesLoaded.value || instancesLoading.value) return
    instancesLoading.value = true
    try {
      const list = await fetchComponentInstances()
      // The list endpoint is minimal, so hydrate each instance by id
      componentInstances.value = await Promise.all(
        list.map((i) => fetchComponentInstanceById(i.componentInstanceId).catch(() => i)),
      )
      instancesLoaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      instancesLoading.value = false
    }
  }

  return {
    components,
    loading,
    loaded,
    error,
    detailsHydrated,
    componentInstances,
    instancesLoading,
    instancesLoaded,
    instancesByComponent,
    getInstancesForComponent,
    unmappedInstances,
    loadComponentInstances,
    componentMap,
    componentsBySystem,
    getComponentsForSystem,
    hasDetailError: errs.hasDetailError,
    load,
    loadComponentDetail,
    loadAllDetails,
  }
})
