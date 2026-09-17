import { defineStore } from 'pinia'
import { fetchCapabilities, fetchCapabilityById } from '@/api/capabilities'
import type { Capability } from '@/types/capability'
import { createResourceCollection } from './resourceCollection'

export const useCapabilitiesStore = defineStore('capabilities', () => {
  const res = createResourceCollection<Capability>({
    idOf: (c) => c.capabilityId,
    fetchAll: fetchCapabilities,
    fetchById: fetchCapabilityById,
  })

  return {
    capabilities: res.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    detailsHydrated: res.detailsHydrated,
    capabilityMap: res.map,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadCapabilityDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
  }
})
