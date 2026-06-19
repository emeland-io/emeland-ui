import type { ModelInstance } from '@/types/model'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

/**
 * TODO:
 * INFO // WORK IN PROGRESS: The approach for instance discovery is not finalized yet.
 * For now, instances are discovered from configuration or similar sources,
 * since the OpenAPI specification currently lacks an instance-list endpoint.
 */
export async function fetchModels(): Promise<ModelInstance[]> {
  if (USE_MOCKS) {
    const { models } = await import('@/mocks/models')
    return models
  }
  const resp = await fetch('/models.json')
  if (!resp.ok) throw new Error(`Failed to load models: ${resp.status}`)
  return resp.json()
}
