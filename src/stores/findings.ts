import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchFindings,
  fetchFindingById,
  fetchFindingTypes,
  fetchFindingTypeById,
} from '@/api/findings'
import type { Finding, FindingType } from '@/types/finding'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'

export const useFindingsStore = defineStore('findings', () => {
  const findings = ref<Finding[]>([])
  const findingTypes = ref<FindingType[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const typesLoading = ref(false)
  const typesLoaded = ref(false)

  const selectedTypeDetail = ref<FindingType | null>(null)

  const errs = useResourceErrors()

  const typeMap = computed(() => new Map(findingTypes.value.map((ft) => [ft.findingTypeId, ft])))

  function getTypeForFinding(f: Finding | undefined): FindingType | undefined {
    return f?.findingType ? typeMap.value.get(f.findingType.findingTypeId) : undefined
  }

  function getKindForFinding(f: Finding | undefined): string {
    return f?.findingType?.displayName ?? 'Unknown'
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      findings.value = await fetchFindings()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function loadFindingDetail(id: string): Promise<void> {
    await loadDetailInto(
      id,
      fetchFindingById,
      (full) => {
        const safe = full.findingId ? full : { ...full, findingId: id }
        findings.value = findings.value.map((f) => (f.findingId === id ? safe : f))
      },
      errs,
    )
  }

  async function loadFindingTypes(): Promise<void> {
    if (typesLoaded.value || typesLoading.value) return
    typesLoading.value = true
    try {
      findingTypes.value = await fetchFindingTypes()
      typesLoaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      typesLoading.value = false
    }
  }

  async function loadFindingTypeDetail(id: string): Promise<void> {
    selectedTypeDetail.value = null
    try {
      selectedTypeDetail.value = await fetchFindingTypeById(id)
    } catch {
      selectedTypeDetail.value = null
    }
  }

  return {
    findings,
    findingTypes,
    loading,
    loaded,
    error,
    typesLoading,
    typesLoaded,
    selectedTypeDetail,
    typeMap,
    getTypeForFinding,
    getKindForFinding,
    hasDetailError: errs.hasDetailError,
    load,
    loadFindingDetail,
    loadFindingTypes,
    loadFindingTypeDetail,
  }
})
