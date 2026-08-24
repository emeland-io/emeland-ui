import dagre from '@dagrejs/dagre'
import type {
  GraphModel,
  GraphNode,
  GraphEdge,
  GraphEdgeKind,
  GraphNodeKind,
  GraphSize,
  ContextGraphNode,
  InstanceNodeData,
} from '@/types/graph'
import { UNMAPPED_FRAME_ID } from './ids'

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
 * rank them) in their own lane just to the LEFT of the laid-out graph: a
 * dashed frame holding one nested frame per system instance the nodes run on
 * (nodes without one form their own group, last). Keeping them out of the
 * dagre pass and positioning them deterministically stops them from
 * scattering into the connected graph.
 * The `unmapped` nodes are supplied separately (not part of `model`).
 *
 * Inside each group frame the nodes flow into columns of at most `maxRows`
 * rows; the lane grows leftwards away from the graph as it widens.
 */
export function frameUnmappedNodes(
  model: GraphModel,
  unmapped: DagNode[],
  label = 'Unmapped',
  maxRows = 5,
): GraphModel {
  if (unmapped.length === 0) return model

  const PAD_X = 14
  const PAD_TOP = 48 // room for the frame label tab plus breathing space above the first node
  const PAD_BOTTOM = 14
  const LANE_GAP = 72 // gap between the unmapped lane and the main graph
  const NODE_W = SIZE.instance.width
  const NODE_H = SIZE.instance.height
  const V_GAP = 16 // vertical gap between stacked nodes
  const COL_GAP = 16 // horizontal gap between columns inside a group frame
  const INNER_HEADER = 40 // tab row inside a group frame
  const INNER_PAD = 12
  const INNER_GAP = 16 // gap between group frames

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

  // group by the system instance the nodes run on (resolved name carried in
  // the node data); groups sorted by name, the no-instance group last
  const groupOf = (n: DagNode) => (n.data as InstanceNodeData).systemInstance ?? ''
  const labelOf = (n: DagNode) => (n.data as { label?: string }).label ?? ''
  const byGroup = new Map<string, DagNode[]>()
  for (const n of unmapped) {
    const key = groupOf(n)
    byGroup.set(key, [...(byGroup.get(key) ?? []), n])
  }
  const groups = [...byGroup.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
    .map(([key, members]) => {
      const ordered = [...members].sort((a, b) => labelOf(a).localeCompare(labelOf(b)))
      const cols = Math.ceil(ordered.length / maxRows)
      const rows = Math.min(ordered.length, maxRows)
      return {
        key,
        ordered,
        width: 2 * INNER_PAD + cols * NODE_W + (cols - 1) * COL_GAP,
        height: INNER_HEADER + rows * NODE_H + (rows - 1) * V_GAP + INNER_PAD,
      }
    })

  const laneWidth =
    2 * PAD_X + groups.reduce((w, g) => w + g.width, 0) + (groups.length - 1) * INNER_GAP
  const laneHeight = Math.max(...groups.map((g) => g.height))
  const laneX = graphMinX - LANE_GAP - laneWidth

  const frame: ContextGraphNode = {
    id: UNMAPPED_FRAME_ID,
    kind: 'context',
    position: { x: laneX, y: graphMinY - PAD_TOP },
    size: { width: laneWidth, height: PAD_TOP + laneHeight + PAD_BOTTOM },
    selectable: false,
    data: { label, variant: 'unmapped', count: unmapped.length },
  }

  const placed: GraphNode[] = []
  let innerX = PAD_X
  for (const g of groups) {
    const frameId = `${UNMAPPED_FRAME_ID}:${g.key || 'none'}`
    placed.push({
      id: frameId,
      kind: 'context',
      parentId: frame.id,
      position: { x: innerX, y: PAD_TOP },
      size: { width: g.width, height: g.height },
      selectable: false,
      data: {
        label: g.key || 'No system instance',
        variant: 'group',
        count: g.ordered.length,
        title: g.key || 'No system instance',
      },
    } as GraphNode)
    g.ordered.forEach((n, i) => {
      const col = Math.floor(i / maxRows)
      const row = i % maxRows
      placed.push({
        id: n.id,
        kind: n.kind,
        parentId: frameId,
        position: {
          x: INNER_PAD + col * (NODE_W + COL_GAP),
          y: INNER_HEADER + row * (NODE_H + V_GAP),
        },
        // fixed height so the stack has a uniform pitch regardless of node content
        // (e.g. some unmapped nodes carry a context sub-line, some don't)
        size: { width: n.size?.width ?? NODE_W, height: NODE_H },
        selectable: n.selectable ?? true,
        data: n.data,
      } as GraphNode)
    })
    innerX += g.width + INNER_GAP
  }

  return { nodes: [frame, ...placed, ...model.nodes], edges: model.edges }
}
