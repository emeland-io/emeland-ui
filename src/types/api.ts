/**
 * Api types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, Version, Annotations } from './common'

export type ApiType = 'Unknown' | 'OpenAPI' | 'GraphQL' | 'gRPC' | 'Other'

export interface Api {
  apiId: UUID
  displayName: string
  description?: string
  version: Version
  type: ApiType
  system: UUID
  annotations: Annotations
}

export interface ApiInstance {
  apiInstanceId: UUID
  displayName: string
  api?: UUID
  systemInstance?: UUID
  annotations: Annotations
}
