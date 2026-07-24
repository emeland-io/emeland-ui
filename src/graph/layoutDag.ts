import dagre from '@dagrejs/dagre'
import type { GraphModel, GraphNode, GraphEdge, GraphNodeKind, GraphSize } from '@/types/graph'

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
  stagger?: number
}

const SIZE: Record<GraphNodeKind, { width: number; height: number }> = {
  component: { width: 200, height: 60 },
  api: { width: 208, height: 46 },
  system: { width: 208, height: 60 },
  instance: { width: 200, height: 60 },
  context: { width: 220, height: 80 },
}

export function layoutDag(input: LayoutDagInput): GraphModel {
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: input.direction ?? 'LR',
    nodesep: input.nodeSep ?? 52,
    ranksep: input.rankSep ?? 160,
    marginx: 16,
    marginy: 16,
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
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target)
  }

  dagre.layout(g)

  const stagger = input.stagger ?? 0
  const columnOffset = new Map<number, number>()
  if (stagger > 0) {
    const columns = [...new Set(input.nodes.map((n) => Math.round(g.node(n.id)?.x ?? 0)))].sort(
      (a, b) => a - b,
    )
    columns.forEach((x, i) => columnOffset.set(x, (i % 2 === 0 ? -1 : 1) * (stagger / 2)))
  }

  const nodes: GraphNode[] = input.nodes.map((n) => {
    const pos = g.node(n.id) // dagre gives the node centre
    const { width, height } = dims.get(n.id)!
    const yOffset = stagger > 0 ? (columnOffset.get(Math.round(pos?.x ?? 0)) ?? 0) : 0
    return {
      id: n.id,
      kind: n.kind,
      position: { x: (pos?.x ?? 0) - width / 2, y: (pos?.y ?? 0) + yOffset - height / 2 },
      size: { width },
      selectable: n.selectable ?? true,
      data: n.data,
    } as GraphNode
  })

  return { nodes, edges: [...input.edges] }
}
