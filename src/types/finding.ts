import type { Annotations, EntityRef, ResourceType, TypeEntity } from './common'

export type FindingTypeRef = EntityRef<'findingTypeId'>
export type FindingKind =
  'ContextTypeMissing' | 'ContextParentNotFound' | 'NodeTypeMissing' | string

export interface FindingTypeRef {
  findingTypeId: string
  displayName: string
}

export interface FindingResource {
  resourceId: string
  displayName: string
  resourceType: ResourceType
}

export type FindingType = TypeEntity<'findingTypeId'>

export interface Finding {
  findingId: string
  displayName: string
  description?: string
  findingType?: FindingTypeRef
  resources: FindingResource[]
  reference?: string
  annotations: Annotations
}
