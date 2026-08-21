import { MODEL_API } from '@/constants/api'
import type { Model } from '@/types/model'
import { USE_MOCKS, getJson } from './fetch'

export async function fetchModel(): Promise<Model> {
  if (USE_MOCKS) {
    const { model } = await import('@/mocks/model')
    return model
  }
  return getJson<Model>(MODEL_API.model, 'model')
}
