/**
 * Context types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, Annotations, TypeEntity } from './common'

export type ContextType = TypeEntity<'contextTypeId'>

export interface Context {
  contextId: UUID
  displayName: string
  description?: string
  contextTypeId?: UUID
  parentId?: UUID
  annotations: Annotations
}
