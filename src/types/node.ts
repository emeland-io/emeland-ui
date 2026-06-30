import type { UUID } from './common'

export interface NodeTypeRef {
  nodeTypeId: UUID
  displayName: string
}

export interface NodeType {
  nodeTypeId: UUID
  displayName: string
  description?: string
  annotations: Record<string, string>
}

export interface Node {
  nodeId: UUID
  displayName: string
  description?: string
  nodeType?: NodeTypeRef
  annotations: Record<string, string>
}
