import type { UUID, Annotations, EntityRef, TypeEntity } from './common'

export type NodeTypeRef = EntityRef<'nodeTypeId'>

export type NodeType = TypeEntity<'nodeTypeId'>

export interface Node {
  nodeId: UUID
  displayName: string
  description?: string
  nodeType?: NodeTypeRef
  annotations: Annotations
}
