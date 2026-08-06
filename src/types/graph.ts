export type GraphNodeKind = 'system' | 'instance' | 'context' | 'context-node' | 'api' | 'component'
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
  description?: string
  version?: string
  findings?: number
  findingKinds?: string[]
  instanceNames?: string[]
}
export interface InstanceNodeData {
  label: string
  parent?: string
  context?: string
  system?: string
  component?: string
  systemInstance?: string
  type?: 'SystemInstance' | 'ComponentInstance' | 'ApiInstance'
  unmapped?: boolean
  unresolved?: boolean
}
export interface ContextNodeData {
  label: string
  variant?: 'context' | 'unmapped'
  count?: number
}
export interface ContextItemNodeData {
  label: string
  description?: string
  type?: string
  instances?: number
  instanceNames?: string[]
  findings?: number
  findingKinds?: string[]
}
export interface ApiNodeData {
  label: string
  description?: string
  version?: string
  /** true when the API is consumed in a context it is not provided in */
  crosses?: boolean
  /** number of contexts the API is consumed in but not provided in */
  crossCount?: number
  findings?: number
  findingKinds?: string[]
}
export interface ComponentNodeData {
  label: string
  description?: string
  system?: string
  findings?: number
  findingKinds?: string[]
  instanceNames?: string[]
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
  sourceHandle?: string
  targetHandle?: string
}

export interface GraphModel {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphNodeClick {
  id: string
  kind: GraphNodeKind
}
