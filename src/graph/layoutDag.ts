import dagre from '@dagrejs/dagre'
import type {
  GraphModel,
  GraphNode,
  GraphEdge,
  GraphEdgeKind,
  GraphNodeKind,
  GraphSize,
} from '@/types/graph'

/**
 * Generic directed-graph layout via dagre
 */

export interface DagNode {
  id: string
  kind: GraphNodeKind
  data: GraphNode['data']
  size?: GraphSize
  selectable?: boolean
}

export interface LayoutDagInput {
  nodes: DagNode[]
  edges: GraphEdge[]
  direction?: 'LR' | 'TB'
  nodeSep?: number
  rankSep?: number
  edgeSep?: number
}

const EDGE_WEIGHT: Record<GraphEdgeKind, number> = {
  contains: 10,
  communicates: 2,
  provides: 2,
  consumes: 1,
  default: 1,
}

const SIZE: Record<GraphNodeKind, { width: number; height: number }> = {
  component: { width: 200, height: 60 },
  api: { width: 208, height: 46 },
  system: { width: 208, height: 60 },
  instance: { width: 200, height: 60 },
  context: { width: 220, height: 80 },
  'context-node': { width: 208, height: 60 },
}

export function layoutDag(input: LayoutDagInput): GraphModel {
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: input.direction ?? 'LR',
    nodesep: input.nodeSep ?? 72,
    ranksep: input.rankSep ?? 130,
    edgesep: input.edgeSep ?? 28,
    marginx: 16,
    marginy: 16,
    acyclicer: 'greedy',
  })
  g.setDefaultEdgeLabel(() => ({}))

  const dims = new Map<string, { width: number; height: number }>()
  for (const n of input.nodes) {
    const width = n.size?.width ?? SIZE[n.kind].width
    const height = n.size?.height ?? SIZE[n.kind].height
    dims.set(n.id, { width, height })
    g.setNode(n.id, { width, height })
  }
  for (const e of input.edges) {
    if (!g.hasNode(e.source) || !g.hasNode(e.target)) continue
    g.setEdge(e.source, e.target, { weight: EDGE_WEIGHT[e.kind ?? 'default'] })
  }

  dagre.layout(g)

  const nodes: GraphNode[] = input.nodes.map((n) => {
    const pos = g.node(n.id) // dagre gives the node centre
    const { width, height } = dims.get(n.id)!
    return {
      id: n.id,
      kind: n.kind,
      position: { x: (pos?.x ?? 0) - width / 2, y: (pos?.y ?? 0) - height / 2 },
      size: { width },
      selectable: n.selectable ?? true,
      data: n.data,
    } as GraphNode
  })

  return { nodes, edges: [...input.edges] }
}
