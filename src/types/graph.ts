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

export interface NodeInstanceRef {
  name: string
  unresolved?: boolean
}

export interface BaseNodeData {
  label: string
  description?: string
  findings?: number
  findingKinds?: string[]
  instanceNames?: NodeInstanceRef[]
}

export interface SystemNodeData extends BaseNodeData {
  abstract: boolean
  version?: string
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
  /** 'context' = a real grouping column; 'unmapped' = the unmapped-instance bucket; 'group' = a nested group inside it */
  variant?: 'context' | 'unmapped' | 'group'
  /** number of members inside the frame, shown as a badge in the tab */
  count?: number
  /** tooltip override for the frame tab (e.g. the full unresolved reference) */
  title?: string
}
export interface ContextItemNodeData extends BaseNodeData {
  type?: string
  instances?: number
}
export interface ApiNodeData extends BaseNodeData {
  version?: string
  /** true when the API is consumed in a context it is not provided in */
  crosses?: boolean
  /** number of contexts the API is consumed in but not provided in */
  crossCount?: number
  /** display names of providing components (tooltip relation section) */
  providers?: string[]
  /** display names of consuming components (tooltip relation section) */
  consumers?: string[]
}
export interface ComponentNodeData extends BaseNodeData {
  system?: string
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
export interface ContextItemGraphNode extends BaseGraphNode {
  kind: 'context-node'
  data: ContextItemNodeData
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
  | ContextItemGraphNode
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
