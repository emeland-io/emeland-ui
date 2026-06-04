import type { ApiReference } from './api'
import type { Annotations, EntityVersion, UUID, Version } from './common'
import type { SystemInstanceReference, SystemReference } from './system'

export interface Component {
  componentId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  version: Version
  system: SystemReference
  consumes: ApiReference[]
  provides: ApiReference[]
  annotations: Annotations
}

export interface ComponentInstance {
  instanceId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  componentReference?: ComponentReference
  systemInstance?: SystemInstanceReference
  annotations: Annotations
}

export interface ComponentReference {
  component?: Component
  componentId: UUID
  componentReference?: EntityVersion
}
