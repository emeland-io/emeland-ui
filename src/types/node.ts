import type { Annotations, UUID } from './common'

export interface Node {
  nodeId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  annotations: Annotations
  nodeType: NodeType
}

export interface NodeType {
  nodeTypeId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  annotations: Annotations
}

export interface NodeTypeReference {
  nodeType?: NodeType
  nodeTypeId: UUID
}
