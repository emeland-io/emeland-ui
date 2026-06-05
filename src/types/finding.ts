/**
 * Finding types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, ResourceReference, Annotations } from './common'

export type FindingKind =
  | 'ContextTypeMissing'
  | 'ContextParentNotFound'
  | 'NodeTypeMissing'
  | string

export interface FindingType {
  findingTypeId: UUID
  displayName: string
  description?: string
  annotations: Annotations
}

export interface Finding {
  findingId: UUID
  summary: string
  description?: string
  type: UUID
  resources: ResourceReference[]
  annotations: Annotations
}
