import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchModel } from '@/api/model'
import type { Model } from '@/types/model'

export const useModelStore = defineStore('model', () => {
  const model = ref<Model | null>(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      model.value = await fetchModel()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { model, loading, loaded, error, load }
})
