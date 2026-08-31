import { defineStore } from 'pinia'
import { computed } from 'vue'
import {
  fetchFindings,
  fetchFindingById,
  fetchFindingTypes,
  fetchFindingTypeById,
} from '@/api/findings'
import type { Finding, FindingType } from '@/types/finding'
import { createResourceCollection } from './resourceCollection'

export const useFindingsStore = defineStore('findings', () => {
  const res = createResourceCollection<Finding, unknown, FindingType>({
    idOf: (f) => f.findingId,
    fetchAll: fetchFindings,
    fetchById: fetchFindingById,
    // the byId payload may lack findingId; keep the requested one
    mergeDetail: (full, id) => (full.findingId ? full : { ...full, findingId: id }),
    types: {
      idOf: (t) => t.findingTypeId,
      fetchAll: fetchFindingTypes,
      fetchById: fetchFindingTypeById,
    },
  })

  const findingCountByResource = computed(() => {
    const m = new Map<string, number>()
    for (const f of res.items.value) {
      for (const r of f.resources) {
        m.set(r.resourceId, (m.get(r.resourceId) ?? 0) + 1)
      }
    }
    return m
  })

  function findingCountFor(resourceId: string): number {
    return findingCountByResource.value.get(resourceId) ?? 0
  }

  function getTypeForFinding(f: Finding | undefined): FindingType | undefined {
    return f?.findingType ? res.types.map.value.get(f.findingType.findingTypeId) : undefined
  }

  function getKindForFinding(f: Finding | undefined): string {
    const name = f?.findingType?.displayName?.trim()
    return name ? name : 'Unknown'
  }

  const findingKindsByResource = computed(() => {
    const m = new Map<string, Set<string>>()
    for (const f of res.items.value) {
      const kind = getKindForFinding(f)
      for (const r of f.resources) {
        m.set(r.resourceId, (m.get(r.resourceId) ?? new Set()).add(kind))
      }
    }
    return m
  })

  function findingKindsFor(resourceId: string): string[] {
    return [...(findingKindsByResource.value.get(resourceId) ?? [])].sort()
  }

  return {
    findings: res.items,
    findingTypes: res.types.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    typesLoading: res.types.loading,
    typesLoaded: res.types.loaded,
    selectedTypeDetail: res.types.selectedDetail,
    typeMap: res.types.map,
    findingCountFor,
    findingKindsFor,
    getTypeForFinding,
    getKindForFinding,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadFindingDetail: res.loadDetail,
    loadFindingTypes: res.types.load,
    loadFindingTypeDetail: res.types.loadDetail,
  }
})
