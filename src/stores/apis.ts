import { defineStore } from 'pinia'
import { fetchApis, fetchApiById, fetchApiInstances, fetchApiInstanceById } from '@/api/apis'
import type { Api, ApiInstance } from '@/types/api'
import { createResourceCollection } from './resourceCollection'

export const useApiStore = defineStore('api', () => {
  const res = createResourceCollection<Api, ApiInstance>({
    idOf: (a) => a.apiId,
    fetchAll: fetchApis,
    fetchById: fetchApiById,
    instances: {
      idOf: (i) => i.apiInstanceId,
      parentOf: (i) => i.api || undefined,
      fetchAll: fetchApiInstances,
      fetchById: fetchApiInstanceById,
    },
  })

  function getApiName(id: string): string | undefined {
    return res.map.value.get(id)?.displayName
  }

  return {
    apis: res.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    detailsHydrated: res.detailsHydrated,
    apiInstances: res.instances.items,
    instancesLoading: res.instances.loading,
    instancesLoaded: res.instances.loaded,
    instancesByApi: res.instances.byParent,
    getInstancesForApi: res.instances.getFor,
    unmappedInstances: res.instances.unmapped,
    loadApiInstances: res.instances.load,
    apiMap: res.map,
    getApiName,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadApiDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
  }
})
