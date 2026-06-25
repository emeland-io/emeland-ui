import type { UUID } from './common'

export interface NodeTypeRef {
  nodeTypeId: UUID
  displayName: string
  type: string
}

export interface NodeType {
  nodeTypeId: UUID
  displayName: string
  description?: string
  type?: string
  annotations: Record<string, string>
}

export interface Node {
  nodeId: UUID
  displayName: string
  description?: string
  nodeType?: NodeTypeRef
  annotations: Record<string, string>
}
