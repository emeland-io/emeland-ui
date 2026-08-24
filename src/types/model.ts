import type { UUID, Annotations } from './common'

export interface Model {
  modelId: UUID
  displayName: string
  description?: string
  baseUrl?: string
  environment?: string
  version?: string
  status?: 'online' | 'offline' | 'unknown'
  host?: string
  region?: string
  annotations?: Annotations
}
