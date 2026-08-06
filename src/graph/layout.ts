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
  /**
   * When true the member is not banded with the shared rows; instead it packs
   * from the top of its own frame (used for unmapped instances, which have no
   * system anchor to align to and would otherwise stagger across columns).
   * Floating members flow into columns of at most `floatMaxRows` rows.
   */
  floatTop?: boolean
  /**
   * Group key for floating members (e.g. the unresolved system reference).
   * Consecutive members with a different key get a small gap between them so
   * the grouping reads visually. Members are placed in input order, so the
   * caller pre-sorts to keep each group contiguous.
   */
  floatGroup?: string
}

export interface LayoutFrame {
  id: string
  kind: GraphNodeKind
  data: GraphNode['data']
  order?: number
  /**
   * When set, this frame is laid out inside its parent frame (nested
   * grouping, e.g. one inner frame per system group inside the unmapped
   * frame). Inner frames size to their own content.
   */
  parentId?: string
  /**
   * Place this frame before the whole graph (left of the anchors), like the
   * unmapped lanes in the API/component graphs, instead of with the frames
   * after the anchors.
   */
  before?: boolean
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
  /** max floating (unmapped) rows per column before flowing into a new column */
  floatMaxRows?: number
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
  floatMaxRows: 5,
}

/** extra vertical gap between floating members of different float groups */
const FLOAT_GROUP_GAP = 12
/** horizontal gap between float columns inside a frame */
const FLOAT_COL_GAP = 16
/** nested (inner) frame chrome: tab row height, padding and gap between frames */
const INNER_HEADER = 40
const INNER_PAD = 12
const INNER_GAP = 16

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
  const innerX = Math.max(0, (o.frameWidth - o.memberWidth) / 2)

  // Float members (e.g. unmapped instances) pack from the TOP of their own
  // frame, independent of the shared row bands, so they don't stagger across
  // columns. Each column holds at most `floatMaxRows` members before flowing
  // into the next column to its right; a small gap separates consecutive
  // float groups. The frame widens to fit its columns.
  const frameById = new Map(input.frames.map((f) => [f.id, f]))
  const isInner = (id: string) => !!frameById.get(id)?.parentId
  const floatPadXOf = (id: string) => (isInner(id) ? INNER_PAD : innerX)
  const floatHeaderOf = (id: string) => (isInner(id) ? INNER_HEADER : o.header)

  const floatPos = new Map<string, { col: number; y: number }>()
  const floatCols = new Map<string, number>()
  const floatsByFrame = new Map<string, LayoutMember[]>()
  for (const m of floating) {
    floatsByFrame.set(m.frameId, [...(floatsByFrame.get(m.frameId) ?? []), m])
  }
  const bandedFrames = new Set(banded.map((m) => m.frameId))
  const floatBottomOf = new Map<string, number>() // per frame: deepest float node bottom
  let floatZoneBottom = 0 // deepest float stack among frames that also hold banded members
  for (const [frameId, members] of floatsByFrame) {
    let col = 0
    let rows = 0
    let y = floatHeaderOf(frameId)
    let bottom = y
    let prevGroup: string | undefined
    for (const m of members) {
      if (rows === o.floatMaxRows) {
        col++
        rows = 0
        y = floatHeaderOf(frameId)
        prevGroup = undefined
      }
      if (prevGroup !== undefined && m.floatGroup !== prevGroup) y += FLOAT_GROUP_GAP
      floatPos.set(m.id, { col, y })
      prevGroup = m.floatGroup
      rows++
      y += o.rowH
      bottom = Math.max(bottom, y - o.rowH + o.nodeH)
    }
    floatCols.set(frameId, col + 1)
    floatBottomOf.set(frameId, bottom)
    if (bandedFrames.has(frameId)) floatZoneBottom = Math.max(floatZoneBottom, bottom)
  }

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
  // banded rows sit below the reserved float zone (keeps the shared bands
  // aligned across frames when floats and banded members share a frame)
  const bandBasePx = floatZoneBottom > 0 ? floatZoneBottom + (o.rowH - o.nodeH) : 0
  const bandedBottom = row > 0 ? bandBasePx + rowY(row - 1) + o.nodeH : 0
  // frames holding banded members share the global band height so the columns
  // stay aligned; float-only frames (e.g. the unmapped bucket) size to their
  // own content instead of stretching to the tallest band
  const bandedHeight = Math.max(o.header + o.pad, bandedBottom + o.pad)

  const orderedFrames = [...input.frames].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const topFrames: LayoutFrame[] = []
  const innerFramesOf = new Map<string, LayoutFrame[]>()
  for (const f of orderedFrames) {
    if (f.parentId) innerFramesOf.set(f.parentId, [...(innerFramesOf.get(f.parentId) ?? []), f])
    else topFrames.push(f)
  }

  // frames with several float columns widen beyond the default frame width;
  // frames with inner frames fit them side by side
  const frameWidthOf = (id: string): number => {
    const kids = innerFramesOf.get(id)
    if (kids?.length) {
      const inner = kids.reduce((w, k) => w + frameWidthOf(k.id), 0)
      return 2 * o.pad + inner + (kids.length - 1) * INNER_GAP
    }
    const cols = floatCols.get(id) ?? 0
    if (cols <= 1) return isInner(id) ? 2 * INNER_PAD + o.memberWidth : o.frameWidth
    return floatPadXOf(id) * 2 + cols * o.memberWidth + (cols - 1) * FLOAT_COL_GAP
  }

  const frameHeightOf = (id: string): number => {
    const kids = innerFramesOf.get(id)
    if (kids?.length) {
      return o.header + Math.max(...kids.map((k) => frameHeightOf(k.id))) + o.pad
    }
    const floats = floatBottomOf.get(id) ?? 0
    if (isInner(id)) return floats + INNER_PAD
    if (bandedFrames.has(id) || floats === 0) return Math.max(bandedHeight, floats + o.pad)
    return floats + o.pad
  }

  // frames flagged `before` get their own lane left of the anchors (like the
  // unmapped lanes in the API/component graphs); the rest of the graph shifts
  // right by the lane width
  const beforeFrames = topFrames.filter((f) => f.before)
  const graphFrames = topFrames.filter((f) => !f.before)
  const laneWidth = beforeFrames.length
    ? beforeFrames.reduce((w, f) => w + frameWidthOf(f.id), 0) + beforeFrames.length * o.columnGap
    : 0
  const anchorX0 = o.anchorX + laneWidth

  for (const a of input.anchors ?? []) {
    nodes.push({
      id: a.id,
      kind: a.kind,
      position: {
        x: anchorX0 + (a.depth ?? 0) * o.anchorIndent,
        y: bandBasePx + rowY(bandCentre.get(a.rowKey) ?? 0),
      },
      size: { width: o.anchorWidth },
      selectable: a.selectable ?? false,
      data: a.data,
    } as GraphNode)
  }

  const maxDepth = Math.max(0, ...(input.anchors ?? []).map((a) => a.depth ?? 0))
  const anchorsRight = anchorX0 + maxDepth * o.anchorIndent + o.anchorWidth
  const frameStart = Math.max(o.frameX0, anchorsRight + o.columnGap)

  const memberCount = new Map<string, number>()
  for (const m of input.members) {
    memberCount.set(m.frameId, (memberCount.get(m.frameId) ?? 0) + 1)
  }

  const frameX = new Map<string, number>()
  const pushFrameNode = (
    f: LayoutFrame,
    x: number,
    y: number,
    width: number,
    height: number,
    parentId?: string,
  ) => {
    frameX.set(f.id, x)
    nodes.push({
      id: f.id,
      kind: f.kind,
      parentId,
      position: { x, y },
      size: { width, height },
      selectable: false,
      // real grouping columns; explicit data on the frame wins over these defaults
      data: {
        variant: 'context',
        count: memberCount.get(f.id) ?? 0,
        ...(f.data as ContextNodeData),
      },
    } as GraphNode)
  }

  // places a top-level frame plus its inner frames; returns its width
  const placeTopFrame = (f: LayoutFrame, x: number) => {
    const width = frameWidthOf(f.id)
    pushFrameNode(f, x, 0, width, frameHeightOf(f.id))
    let innerNextX = o.pad
    for (const k of innerFramesOf.get(f.id) ?? []) {
      const kw = frameWidthOf(k.id)
      pushFrameNode(k, innerNextX, o.header, kw, frameHeightOf(k.id), f.id)
      innerNextX += kw + INNER_GAP
    }
    return width
  }

  let beforeX = o.anchorX
  for (const f of beforeFrames) beforeX += placeTopFrame(f, beforeX) + o.columnGap
  let nextX = frameStart
  for (const f of graphFrames) nextX += placeTopFrame(f, nextX) + o.columnGap

  for (const m of input.members) {
    if (!frameX.has(m.frameId)) continue // unknown frame -> skip
    const pos = m.floatTop
      ? {
          x:
            floatPadXOf(m.frameId) +
            (floatPos.get(m.id)?.col ?? 0) * (o.memberWidth + FLOAT_COL_GAP),
          y: floatPos.get(m.id)?.y ?? floatHeaderOf(m.frameId),
        }
      : { x: innerX, y: bandBasePx + rowY(memberRow.get(m.id) ?? 0) }
    nodes.push({
      id: m.id,
      kind: m.kind,
      parentId: m.frameId,
      position: pos,
      size: { width: o.memberWidth },
      selectable: m.selectable ?? true,
      data: m.data,
    } as GraphNode)
  }

  return { nodes, edges }
}
