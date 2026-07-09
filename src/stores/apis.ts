import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchApis } from '@/api/apis'
import type { Api } from '@/types/api'

export const useApiStore = defineStore('api', () => {
  const apis = ref<Api[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const apiMap = computed(() => new Map(apis.value.map((a) => [a.apiId, a])))

  function getApiName(id: string): string | undefined {
    return apiMap.value.get(id)?.displayName
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      apis.value = await fetchApis()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { apis, loading, loaded, error, apiMap, getApiName, load }
})
