export type GraphNodeKind = 'system' | 'instance' | 'context' | 'api' | 'component'
export type GraphEdgeKind = 'contains' | 'communicates' | 'provides' | 'consumes' | 'default'

export interface GraphPosition {
  x: number
  y: number
}

export interface GraphSize {
  width: number
  height?: number
}

interface BaseGraphNode {
  id: string
  position: GraphPosition
  size?: GraphSize
  parentId?: string
  selectable?: boolean
}

export interface SystemNodeData {
  label: string
  abstract: boolean
  version?: string
}
export interface InstanceNodeData {
  label: string
}
export interface ContextNodeData {
  label: string
}
export interface ApiNodeData {
  label: string
  version?: string
}
export interface ComponentNodeData {
  label: string
  system?: string
  instanceCount?: number
}

export interface SystemGraphNode extends BaseGraphNode {
  kind: 'system'
  data: SystemNodeData
}
export interface InstanceGraphNode extends BaseGraphNode {
  kind: 'instance'
  data: InstanceNodeData
}
export interface ContextGraphNode extends BaseGraphNode {
  kind: 'context'
  data: ContextNodeData
}
export interface ApiGraphNode extends BaseGraphNode {
  kind: 'api'
  data: ApiNodeData
}
export interface ComponentGraphNode extends BaseGraphNode {
  kind: 'component'
  data: ComponentNodeData
}

export type GraphNode =
  | SystemGraphNode
  | InstanceGraphNode
  | ContextGraphNode
  | ApiGraphNode
  | ComponentGraphNode

export interface GraphEdge {
  id: string
  source: string
  target: string
  kind?: GraphEdgeKind
}

export interface GraphModel {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphNodeClick {
  id: string
  kind: GraphNodeKind
}
