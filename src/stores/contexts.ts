import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchContexts,
  fetchContextById,
  fetchContextTypes,
  fetchContextTypeById,
} from '@/api/contexts'
import type { Context, ContextType } from '@/types/context'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'

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
  const detailsHydrated = ref(false)

  const errs = useResourceErrors()

  let loadInflight: Promise<void> | null = null
  let detailsInflight: Promise<void> | null = null
  let typesInflight: Promise<void> | null = null

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
    if (!id || typeDetailCache.value[id] || errs.isMissing(id)) return
    try {
      const full = await fetchContextTypeById(id)
      typeDetailCache.value = { ...typeDetailCache.value, [id]: full }
    } catch {
      errs.markMissing(id)
    }
  }

  async function load() {
    if (loaded.value) return
    if (loadInflight) return loadInflight
    loadInflight = (async () => {
      loading.value = true
      error.value = null
      try {
        contexts.value = await fetchContexts()
        loaded.value = true
      } catch (e) {
        error.value = (e as Error).message
      } finally {
        loading.value = false
        loadInflight = null
      }
    })()
    return loadInflight
  }

  async function loadContextDetail(id: string): Promise<void> {
    await loadDetailInto(
      id,
      fetchContextById,
      (full) => {
        contexts.value = contexts.value.map((c) => (c.contextId === id ? full : c))
      },
      errs,
    )
  }

  async function loadAllDetails(): Promise<void> {
    if (detailsHydrated.value) return
    if (detailsInflight) return detailsInflight
    if (!loaded.value || contexts.value.length === 0) return
    detailsInflight = (async () => {
      try {
        const full = await Promise.all(
          contexts.value.map((c) => fetchContextById(c.contextId).catch(() => c)),
        )
        contexts.value = full
        detailsHydrated.value = true
      } catch (e) {
        error.value = (e as Error).message
      } finally {
        detailsInflight = null
      }
    })()
    return detailsInflight
  }

  async function loadContextTypes(): Promise<void> {
    if (typesLoaded.value) return
    if (typesInflight) return typesInflight
    typesInflight = (async () => {
      typesLoading.value = true
      try {
        contextTypes.value = await fetchContextTypes()
        typesLoaded.value = true
      } catch (e) {
        error.value = (e as Error).message
      } finally {
        typesLoading.value = false
        typesInflight = null
      }
    })()
    return typesInflight
  }

  async function ensureHydrated(): Promise<void> {
    await load()
    await Promise.all([loadAllDetails(), loadContextTypes()])
  }

  async function loadContextTypeDetail(id: string): Promise<void> {
    selectedTypeDetail.value = null
    try {
      selectedTypeDetail.value = await fetchContextTypeById(id)
    } catch {
      selectedTypeDetail.value = null
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
    detailsHydrated,
    typeMap,
    contextMap,
    getTypeForContext,
    getTypeName,
    getParentName,
    isParentUnresolved,
    hasDetailError: errs.hasDetailError,
    ensureContextType,
    ensureHydrated,
    load,
    loadContextDetail,
    loadAllDetails,
    loadContextTypes,
    loadContextTypeDetail,
  }
})