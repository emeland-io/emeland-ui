import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { fetchModels } from '@/api/models'
import type { ModelInstance } from '@/types/model'

const ACTIVE_KEY = 'emeland-active-model'

export const useModelsStore = defineStore('models', () => {
  const models = ref<ModelInstance[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const activeId = ref<string>(localStorage.getItem(ACTIVE_KEY) ?? '')

  const activeModel = computed(() => models.value.find((m) => m.modelId === activeId.value))

  const activeBaseUrl = computed(() => activeModel.value?.baseUrl ?? '')

  function setActive(modelId: string) {
    if (!models.value.some((m) => m.modelId === modelId)) return
    activeId.value = modelId
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      models.value = await fetchModels()
      if (!activeId.value || !models.value.some((m) => m.modelId === activeId.value)) {
        activeId.value = models.value[0]?.modelId ?? ''
      }
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  watch(activeId, (id) => {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
  })

  return {
    models,
    loading,
    loaded,
    error,
    activeId,
    activeModel,
    activeBaseUrl,
    setActive,
    load,
  }
})
