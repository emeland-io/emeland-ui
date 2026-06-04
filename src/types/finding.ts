import type { UUID, ResourceReference, Annotations } from './common'

export type FindingKind =
  | 'ContextTypeMissing'
  | 'ContextParentNotFound'
  | 'NodeTypeMissing'
  | string

export interface FindingType {
  findingTypeId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  annotations: Annotations
}

export interface FindingTypeReference {
  findingType?: FindingType
  findingTypeId: UUID
}

export interface Finding {
  findingId: UUID
  resourceId: UUID
  resourceName: string
  summary: string
  description: string
  resources: ResourceReference[]
  annotations: Annotations
  findingTypeId: UUID
  findingType?: FindingType
}
