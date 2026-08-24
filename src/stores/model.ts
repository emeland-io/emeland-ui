import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchModel } from '@/api/model'
import type { Model } from '@/types/model'
import { loadOnce } from './support'

export const useModelStore = defineStore('model', () => {
  const model = ref<Model | null>(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    await loadOnce(
      { loading, loaded, error },
      async () => {
        model.value = await fetchModel()
      },
      { resetError: true },
    )
  }

  return { model, loading, loaded, error, load }
})
