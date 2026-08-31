import { defineStore } from 'pinia'
import { computed } from 'vue'
import {
  fetchComponents,
  fetchComponentById,
  fetchComponentInstances,
  fetchComponentInstanceById,
} from '@/api/components'
import type { Component, ComponentInstance } from '@/types/component'
import { groupBy } from './support'
import { createResourceCollection } from './resourceCollection'

export const useComponentStore = defineStore('component', () => {
  const res = createResourceCollection<Component, ComponentInstance>({
    idOf: (c) => c.componentId,
    fetchAll: fetchComponents,
    fetchById: fetchComponentById,
    instances: {
      idOf: (i) => i.componentInstanceId,
      parentOf: (i) => i.component,
      fetchAll: fetchComponentInstances,
      fetchById: fetchComponentInstanceById,
    },
  })

  const componentsBySystem = computed(() => groupBy(res.items.value, (c) => c.system))

  function getComponentsForSystem(systemId: string): Component[] {
    return componentsBySystem.value.get(systemId) ?? []
  }

  return {
    components: res.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    detailsHydrated: res.detailsHydrated,
    componentInstances: res.instances.items,
    instancesLoading: res.instances.loading,
    instancesLoaded: res.instances.loaded,
    instancesByComponent: res.instances.byParent,
    getInstancesForComponent: res.instances.getFor,
    unmappedInstances: res.instances.unmapped,
    loadComponentInstances: res.instances.load,
    componentMap: res.map,
    componentsBySystem,
    getComponentsForSystem,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadComponentDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
  }
})
