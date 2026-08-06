import type {
  GraphModel,
  GraphNode,
  GraphEdge,
  GraphNodeKind,
  ContextNodeData,
} from '@/types/graph'

interface NodeSpec {
  id: string
  kind: GraphNodeKind
  data: GraphNode['data']
  selectable?: boolean
}

export interface LayoutAnchor extends NodeSpec {
  rowKey: string
  depth?: number
}

export interface LayoutMember extends NodeSpec {
  frameId: string
  rowKey: string
  floatTop?: boolean
}

export interface LayoutFrame {
  id: string
  kind: GraphNodeKind
  data: GraphNode['data']
  order?: number
}

export interface FramedColumnsInput {
  frames: LayoutFrame[]
  members: LayoutMember[]
  anchors?: LayoutAnchor[]
  edges?: GraphEdge[]
}

export interface FramedColumnsOptions {
  rowH?: number
  nodeH?: number
  header?: number
  pad?: number
  anchorX?: number
  anchorIndent?: number
  anchorWidth?: number
  frameX0?: number
  frameWidth?: number
  memberWidth?: number
  columnGap?: number
}

const DEFAULTS: Required<FramedColumnsOptions> = {
  rowH: 72,
  nodeH: 56,
  header: 48,
  pad: 14,
  anchorX: 0,
  anchorIndent: 288,
  anchorWidth: 208,
  frameX0: 300,
  frameWidth: 244,
  memberWidth: 216,
  columnGap: 72,
}

export function layoutFramedColumns(
  input: FramedColumnsInput,
  options: FramedColumnsOptions = {},
): GraphModel {
  const o = { ...DEFAULTS, ...options }
  const rowY = (r: number) => o.header + r * o.rowH
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = [...(input.edges ?? [])]

  const banded = input.members.filter((m) => !m.floatTop)
  const floating = input.members.filter((m) => m.floatTop)

  const floatRow = new Map<string, number>()
  const floatByFrame = new Map<string, number>()
  for (const m of floating) {
    const r = floatByFrame.get(m.frameId) ?? 0
    floatRow.set(m.id, r)
    floatByFrame.set(m.frameId, r + 1)
  }
  const floatRows = Math.max(0, ...floatByFrame.values())

  const bandOrder: string[] = []
  const bandMembers = new Map<string, LayoutMember[]>()
  const pushBand = (key: string) => {
    if (!bandMembers.has(key)) {
      bandMembers.set(key, [])
      bandOrder.push(key)
    }
  }
  for (const a of input.anchors ?? []) pushBand(a.rowKey)
  for (const m of banded) {
    pushBand(m.rowKey)
    bandMembers.get(m.rowKey)!.push(m)
  }

  const memberRow = new Map<string, number>()
  const bandCentre = new Map<string, number>()
  let row = 0
  for (const key of bandOrder) {
    const members = bandMembers.get(key)!
    if (members.length === 0) {
      bandCentre.set(key, row)
      row += 1
    } else {
      const first = row
      for (const m of members) memberRow.set(m.id, row++)
      bandCentre.set(key, first + (members.length - 1) / 2)
    }
  }

  const bandBase = floatRows
  const totalRows = floatRows + row
  const frameHeight = totalRows > 0 ? rowY(totalRows - 1) + o.nodeH + o.pad : o.header + o.pad

  for (const a of input.anchors ?? []) {
    nodes.push({
      id: a.id,
      kind: a.kind,
      position: {
        x: o.anchorX + (a.depth ?? 0) * o.anchorIndent,
        y: rowY(bandBase + (bandCentre.get(a.rowKey) ?? 0)),
      },
      size: { width: o.anchorWidth },
      selectable: a.selectable ?? false,
      data: a.data,
    } as GraphNode)
  }

  const maxDepth = Math.max(0, ...(input.anchors ?? []).map((a) => a.depth ?? 0))
  const anchorsRight = o.anchorX + maxDepth * o.anchorIndent + o.anchorWidth
  const frameStart = Math.max(o.frameX0, anchorsRight + o.columnGap)

  const memberCount = new Map<string, number>()
  for (const m of input.members) {
    memberCount.set(m.frameId, (memberCount.get(m.frameId) ?? 0) + 1)
  }

  const frameX = new Map<string, number>()
  const orderedFrames = [...input.frames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  orderedFrames.forEach((f, i) => {
    const x = frameStart + i * (o.frameWidth + o.columnGap)
    frameX.set(f.id, x)
    nodes.push({
      id: f.id,
      kind: f.kind,
      position: { x, y: 0 },
      size: { width: o.frameWidth, height: frameHeight },
      selectable: false,
      data: { variant: 'context', count: memberCount.get(f.id) ?? 0, ...(f.data as ContextNodeData) },
    } as GraphNode)
  })

  const innerX = Math.max(0, (o.frameWidth - o.memberWidth) / 2)
  for (const m of input.members) {
    if (!frameX.has(m.frameId)) continue // unknown frame -> skip
    const r = m.floatTop ? (floatRow.get(m.id) ?? 0) : bandBase + (memberRow.get(m.id) ?? 0)
    nodes.push({
      id: m.id,
      kind: m.kind,
      parentId: m.frameId,
      position: { x: innerX, y: rowY(r) },
      size: { width: o.memberWidth },
      selectable: m.selectable ?? true,
      data: m.data,
    } as GraphNode)
  }

  return { nodes, edges }
}
