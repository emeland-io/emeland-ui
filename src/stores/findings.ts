import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchFindings, fetchFindingTypes } from '@/api/findings'
import type { Finding, FindingType } from '@/types/finding'

export const useFindingsStore = defineStore('findings', () => {
  const findings = ref<Finding[]>([])
  const findingTypes = ref<FindingType[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const typeMap = computed(() => new Map(findingTypes.value.map((ft) => [ft.findingTypeId, ft])))

  function getTypeForFinding(f: Finding): FindingType | undefined {
    return typeMap.value.get(f.type)
  }

  function getKindForFinding(f: Finding): string {
    return getTypeForFinding(f)?.annotations['emeland.io/finding-kind'] ?? 'Unknown'
  }

  async function load() {
    // Guard against duplicate loads (called from App.vue and views)
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const [f, ft] = await Promise.all([fetchFindings(), fetchFindingTypes()])
      findings.value = f
      findingTypes.value = ft
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return {
    findings,
    findingTypes,
    loading,
    loaded,
    error,
    typeMap,
    getTypeForFinding,
    getKindForFinding,
    load,
  }
})
