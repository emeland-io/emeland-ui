import type { Model } from '@/types/model'
import { USE_MOCKS } from './fetch'

export async function fetchModel(): Promise<Model> {
  if (USE_MOCKS) {
    const { model } = await import('@/mocks/model')
    return model
  }
  const resp = await fetch('/model')
  if (!resp.ok) throw new Error(`Failed to load model: ${resp.status}`)
  return resp.json()
}
