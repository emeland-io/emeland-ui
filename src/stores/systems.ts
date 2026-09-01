import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchSystems,
  fetchSystemById,
  fetchSystemInstances,
  fetchSystemInstanceById,
} from '@/api/systems'
import type { System, SystemInstance } from '@/types/system'
import { loadDetailRef } from './support'
import { createResourceCollection } from './resourceCollection'

export const useSystemStore = defineStore('system', () => {
  const res = createResourceCollection<System, SystemInstance>({
    idOf: (s) => s.systemId,
    fetchAll: fetchSystems,
    fetchById: fetchSystemById,
    instances: {
      idOf: (i) => i.systemInstanceId,
      parentOf: (i) => i.system,
      fetchAll: fetchSystemInstances,
      fetchById: fetchSystemInstanceById,
    },
  })

  const selectedInstanceDetail = ref<SystemInstance | null>(null)

  function getParentName(s: System): string | undefined {
    if (!s.parent) return undefined
    return res.map.value.get(s.parent)?.displayName
  }

  function isParentUnresolved(s: System): boolean {
    return !!s.parent && !res.map.value.has(s.parent)
  }

  function getKindForSystem(s: System): string {
    return s.abstract ? 'Abstract' : 'Concrete'
  }

  async function loadSystemInstanceDetail(id: string): Promise<void> {
    await loadDetailRef(selectedInstanceDetail, () => fetchSystemInstanceById(id))
  }

  return {
    systems: res.items,
    systemInstances: res.instances.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    instancesLoading: res.instances.loading,
    instancesLoaded: res.instances.loaded,
    selectedInstanceDetail,
    detailsHydrated: res.detailsHydrated,
    systemMap: res.map,
    systemInstanceMap: res.instances.map,
    instancesBySystem: res.instances.byParent,
    unmappedInstances: res.instances.unmapped,
    getParentName,
    isParentUnresolved,
    getInstancesForSystem: res.instances.getFor,
    getKindForSystem,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadSystemDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
    loadSystemInstances: res.instances.load,
    loadSystemInstanceDetail,
  }
})
