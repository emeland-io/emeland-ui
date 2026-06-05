import type { Annotations, UUID } from './common'

export interface Context {
  contextId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  annotations: Annotations
  contextType?: ContextType
  contextTypeId?: UUID
  parent?: ContextReference
}

export interface ContextType {
  contextTypeId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  annotations: Annotations
}

export interface ContextReference {
  context?: Context
  contextId: UUID
}
