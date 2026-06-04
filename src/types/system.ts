import type { UUID, Version, Annotations } from './common'
import type { ContextReference } from './context'

export interface System {
  systemId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  version: Version
  annotations: Annotations
}

export interface SystemInstance {
  instanceId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  systemReference?: SystemReference
  contextReference?: ContextReference
  annotations: Annotations
}

export interface SystemInstanceReference {
  systemInstance?: SystemInstance
  instanceId: UUID
}

export interface SystemReference {
  system?: System
  systemId: UUID
}
