export type GraphNodeKind =
  'system' | 'instance' | 'context' | 'context-node' | 'api' | 'component' | 'capability' | 'order'
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
export interface CapabilityNodeData extends BaseNodeData {
  /** latest offered version */
  version?: string
  /** overall lifecycle of the capability (see utils/version capabilityLifecycle) */
  lifecycle?: string
  /** number of orders referencing the capability */
  orders?: number
}
export interface OrderNodeData extends BaseNodeData {
  /** fulfillment state (see utils/orders orderStatus) */
  status?: string
  /** compact status line, e.g. OPEN / 2/3 fulfilled / FULFILLED */
  statusLabel?: string
  /** order date (ISO) */
  orderedAt?: string
  /** number of order items */
  items?: number
  /** per-item fulfillment for the sheet body */
  orderItems?: {
    label: string
    fulfilled: boolean
    description?: string
    version?: string
  }[]
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
export interface CapabilityGraphNode extends BaseGraphNode {
  kind: 'capability'
  data: CapabilityNodeData
}
export interface OrderGraphNode extends BaseGraphNode {
  kind: 'order'
  data: OrderNodeData
}

export type GraphNode =
  | SystemGraphNode
  | InstanceGraphNode
  | ContextGraphNode
  | ContextItemGraphNode
  | ApiGraphNode
  | ComponentGraphNode
  | CapabilityGraphNode
  | OrderGraphNode

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
