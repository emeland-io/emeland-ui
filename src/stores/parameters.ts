import { defineStore } from 'pinia'
import { fetchParameters, fetchParameterById } from '@/api/parameters'
import type { Parameter } from '@/types/parameter'
import { createResourceCollection } from './resourceCollection'

export const useParametersStore = defineStore('parameters', () => {
  const res = createResourceCollection<Parameter>({
    idOf: (p) => p.parameterId,
    fetchAll: fetchParameters,
    fetchById: fetchParameterById,
  })

  return {
    parameters: res.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    detailsHydrated: res.detailsHydrated,
    parameterMap: res.map,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadParameterDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
  }
})
