import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchContexts,
  fetchContextById,
  fetchContextTypes,
  fetchContextTypeById,
} from '@/api/contexts'
import type { Context, ContextType } from '@/types/context'

export const useContextStore = defineStore('context', () => {
  const contexts = ref<Context[]>([])
  const contextTypes = ref<ContextType[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const typesLoading = ref(false)
  const typesLoaded = ref(false)

  const selectedTypeDetail = ref<ContextType | null>(null)
  const typeDetailCache = ref<Record<string, ContextType>>({})

  const typeMap = computed(() => new Map(contextTypes.value.map((ct) => [ct.contextTypeId, ct])))
  const contextMap = computed(() => new Map(contexts.value.map((c) => [c.contextId, c])))

  function getTypeForContext(c: Context): ContextType | undefined {
    if (!c.contextTypeId) return undefined
    return typeDetailCache.value[c.contextTypeId] ?? typeMap.value.get(c.contextTypeId)
  }

  function getTypeName(c: Context): string {
    if (!c.contextTypeId) return 'Unknown'
    return getTypeForContext(c)?.displayName ?? 'Unknown'
  }

  function getParentName(c: Context): string | undefined {
    if (!c.parentId) return undefined
    return contextMap.value.get(c.parentId)?.displayName
  }

  function isParentUnresolved(c: Context): boolean {
    return !!c.parentId && !contextMap.value.has(c.parentId)
  }

  async function ensureContextType(id: string): Promise<void> {
    if (!id || typeDetailCache.value[id]) return
    try {
      const full = await fetchContextTypeById(id)
      typeDetailCache.value = { ...typeDetailCache.value, [id]: full }
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      contexts.value = await fetchContexts()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function loadContextDetail(id: string): Promise<void> {
    try {
      const full = await fetchContextById(id)
      contexts.value = contexts.value.map((c) => (c.contextId === id ? full : c))
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  const detailsHydrated = ref(false)
  async function loadAllDetails(): Promise<void> {
    if (detailsHydrated.value) return
    try {
      const full = await Promise.all(
        contexts.value.map((c) => fetchContextById(c.contextId).catch(() => c)),
      )
      contexts.value = full
      detailsHydrated.value = true
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function loadContextTypes(): Promise<void> {
    if (typesLoaded.value || typesLoading.value) return
    typesLoading.value = true
    try {
      contextTypes.value = await fetchContextTypes()
      typesLoaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      typesLoading.value = false
    }
  }

  async function loadContextTypeDetail(id: string): Promise<void> {
    selectedTypeDetail.value = null
    try {
      selectedTypeDetail.value = await fetchContextTypeById(id)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  return {
    contexts,
    contextTypes,
    loading,
    loaded,
    error,
    typesLoading,
    typesLoaded,
    selectedTypeDetail,
    typeDetailCache,
    typeMap,
    contextMap,
    getTypeForContext,
    getTypeName,
    getParentName,
    isParentUnresolved,
    ensureContextType,
    load,
    loadContextDetail,
    loadAllDetails,
    detailsHydrated,
    loadContextTypes,
    loadContextTypeDetail,
  }
})
