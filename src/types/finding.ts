import type { ResourceType } from './common'

export type FindingKind =
  | 'ContextTypeMissing'
  | 'ContextParentNotFound'
  | 'NodeTypeMissing'
  | string

export interface FindingTypeRef {
  findingTypeId: string
  displayName: string
}

export interface FindingResource {
  resourceId: string
  displayName: string
  resourceType: ResourceType
}

export interface FindingType {
  findingTypeId: string
  displayName: string
  description?: string
  annotations: Record<string, string>
}

export interface Finding {
  findingId: string
  displayName: string
  description?: string
  findingType?: FindingTypeRef
  resources: FindingResource[]
  reference?: string
  annotations: Record<string, string>
}
