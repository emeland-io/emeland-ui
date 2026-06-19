import type { UUID } from './common'

/**
 * INFO // WORK IN PROGRESS: The approach for instance discovery is not finalized yet.
 * For now, instances are discovered from configuration or similar sources,
 * since the OpenAPI specification currently lacks an instance-list endpoint.
 */

export interface ModelInstance {
  modelId: UUID
  displayName: string
  description?: string
  baseUrl: string
  environment?: string
  version?: string
  status?: 'online' | 'offline' | 'unknown'
  annotations?: Record<string, string>
}
