/**
 * Context types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, Annotations } from './common'

export interface ContextType {
  contextTypeId: UUID
  displayName: string
  description?: string
  annotations: Annotations
}

export interface Context {
  contextId: UUID
  displayName: string
  description?: string
  type?: UUID
  parent?: UUID
  annotations: Annotations
}
