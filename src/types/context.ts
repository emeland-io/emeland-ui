/**
 * Context types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID } from './common'

export interface ContextType {
  contextTypeId: UUID
  displayName: string
  description?: string
  annotations: Record<string, string>
}

export interface Context {
  contextId: UUID
  displayName: string
  description?: string
  contextTypeId?: UUID
  parentId?: UUID
  annotations: Record<string, string>
}
