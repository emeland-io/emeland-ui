import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchContexts,
  fetchContextById,
  fetchContextTypes,
  fetchContextTypeById,
} from '@/api/contexts'
import type { Context, ContextType } from '@/types/context'
import { createResourceCollection } from './resourceCollection'

export const useContextStore = defineStore('context', () => {
  const res = createResourceCollection<Context, unknown, ContextType>({
    idOf: (c) => c.contextId,
    fetchAll: fetchContexts,
    fetchById: fetchContextById,
    types: {
      idOf: (t) => t.contextTypeId,
      fetchAll: fetchContextTypes,
      fetchById: fetchContextTypeById,
    },
  })

  // context types fetched on demand (beyond the list), cached per id
  const typeDetailCache = ref<Record<string, ContextType>>({})

  function getTypeForContext(c: Context): ContextType | undefined {
    if (!c.contextTypeId) return undefined
    return typeDetailCache.value[c.contextTypeId] ?? res.types.map.value.get(c.contextTypeId)
  }

  function getTypeName(c: Context): string {
    if (!c.contextTypeId) return 'Unknown'
    return getTypeForContext(c)?.displayName ?? 'Unknown'
  }

  function getParentName(c: Context): string | undefined {
    if (!c.parentId) return undefined
    return res.map.value.get(c.parentId)?.displayName
  }

  function isParentUnresolved(c: Context): boolean {
    return !!c.parentId && !res.map.value.has(c.parentId)
  }

  async function ensureContextType(id: string): Promise<void> {
    if (!id || typeDetailCache.value[id] || res.errs.isMissing(id)) return
    try {
      const full = await fetchContextTypeById(id)
      typeDetailCache.value = { ...typeDetailCache.value, [id]: full }
    } catch {
      res.errs.markMissing(id)
    }
  }

  async function ensureHydrated(): Promise<void> {
    await res.load()
    await Promise.all([res.loadAllDetails(), res.types.load()])
  }

  return {
    contexts: res.items,
    contextTypes: res.types.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    typesLoading: res.types.loading,
    typesLoaded: res.types.loaded,
    selectedTypeDetail: res.types.selectedDetail,
    typeDetailCache,
    detailsHydrated: res.detailsHydrated,
    typeMap: res.types.map,
    contextMap: res.map,
    getTypeForContext,
    getTypeName,
    getParentName,
    isParentUnresolved,
    hasDetailError: res.hasDetailError,
    ensureContextType,
    ensureHydrated,
    load: res.load,
    loadContextDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
    loadContextTypes: res.types.load,
    loadContextTypeDetail: res.types.loadDetail,
  }
})
