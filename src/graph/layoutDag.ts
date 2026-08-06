import dagre from '@dagrejs/dagre'
import type {
  GraphModel,
  GraphNode,
  GraphEdge,
  GraphEdgeKind,
  GraphNodeKind,
  GraphSize,
  ContextGraphNode,
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

/**
 * Places unmapped instance nodes (which are edge-less, so dagre has nowhere to
 * rank them) in their own stacked column just to the LEFT of the laid-out graph,
 * wrapped in a dashed frame. Keeping them out of the dagre pass and positioning
 * them deterministically stops them from scattering into the connected graph.
 * The `unmapped` nodes are supplied separately (not part of `model`).
 */
export function frameUnmappedNodes(
  model: GraphModel,
  unmapped: DagNode[],
  label = 'Unmapped',
): GraphModel {
  if (unmapped.length === 0) return model

  const PAD_X = 14
  const PAD_TOP = 48 // room for the frame label tab plus breathing space above the first node
  const PAD_BOTTOM = 14
  const LANE_GAP = 72 // gap between the unmapped lane and the main graph
  const V_GAP = 16 // vertical gap between stacked unmapped nodes
  const NODE_W = SIZE.instance.width
  const NODE_H = SIZE.instance.height

  // top-left of the laid-out (connected) graph; fall back to origin when empty
  let graphMinX = Infinity
  let graphMinY = Infinity
  for (const n of model.nodes) {
    graphMinX = Math.min(graphMinX, n.position.x)
    graphMinY = Math.min(graphMinY, n.position.y)
  }
  if (!Number.isFinite(graphMinX)) {
    graphMinX = 0
    graphMinY = 0
  }

  const ordered = [...unmapped].sort((a, b) =>
    ((a.data as { label?: string }).label ?? '').localeCompare(
      (b.data as { label?: string }).label ?? '',
    ),
  )

  const nodeX = graphMinX - LANE_GAP - PAD_X - NODE_W
  const startY = graphMinY

  const placed: GraphNode[] = ordered.map(
    (n, i) =>
      ({
        id: n.id,
        kind: n.kind,
        position: { x: nodeX, y: startY + i * (NODE_H + V_GAP) },
        // fixed height so the stack has a uniform pitch regardless of node content
        // (e.g. some unmapped nodes carry a context sub-line, some don't)
        size: { width: n.size?.width ?? NODE_W, height: NODE_H },
        selectable: n.selectable ?? true,
        data: n.data,
      }) as GraphNode,
  )

  const stackHeight = ordered.length * NODE_H + (ordered.length - 1) * V_GAP

  const frame: ContextGraphNode = {
    id: 'frame:unmapped',
    kind: 'context',
    position: { x: nodeX - PAD_X, y: startY - PAD_TOP },
    size: { width: NODE_W + 2 * PAD_X, height: stackHeight + PAD_TOP + PAD_BOTTOM },
    selectable: false,
    data: { label, variant: 'unmapped', count: ordered.length },
  }

  return { nodes: [frame, ...placed, ...model.nodes], edges: model.edges }
}
