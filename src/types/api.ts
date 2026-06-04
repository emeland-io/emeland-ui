import type { Annotations, EntityVersion, UUID, Version } from './common'
import type { SystemInstanceReference, SystemReference } from './system'

export type ApiType = 'Unknown' | 'OpenApi' | 'GraphQL' | 'GRPC' | 'Other'

export interface ApiReference {
  api?: Api
  apiId: UUID
  apiReference?: EntityVersion
}

export interface Api {
  apiId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  version: Version
  type: ApiType
  system: SystemReference
  annotations: Annotations
}

export interface ApiInstance {
  instanceId: UUID
  resourceId: UUID
  displayName: string
  apiReference: ApiReference
  systemInstance: SystemInstanceReference
  annotations: Annotations
}
