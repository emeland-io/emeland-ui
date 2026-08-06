<script setup lang="ts">
import { computed, ref, watch, nextTick, useId, onScopeDispose } from 'vue'
import { IconAlertTriangle, IconCircleOff, IconArrowsExchange } from '@tabler/icons-vue'
import {
  VueFlow,
  useVueFlow,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeMouseEvent,
  type EdgeMouseEvent,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import FlowHandles from './FlowHandles.vue'
import ChannelEdge from './ChannelEdge.vue'
import NodeTooltip from './NodeTooltip.vue'
import MappingTag from '@/components/MappingTag.vue'
import type {
  GraphNode,
  GraphEdge,
  GraphNodeKind,
  SystemNodeData,
  InstanceNodeData,
  ContextNodeData,
  ContextItemNodeData,
  ApiNodeData,
  ComponentNodeData,
} from '@/types/graph'

const props = withDefaults(
  defineProps<{
    nodes: GraphNode[]
    edges: GraphEdge[]
    selectedId?: string
    showControls?: boolean
    matchIds?: Set<string>
  }>(),
  { selectedId: '', showControls: true, matchIds: () => new Set<string>() },
)

const emit = defineEmits<{
  'node-click': [payload: { id: string; kind: GraphNodeKind }]
}>()

const flowId = `flow-${useId()}`
const { fitView, zoomIn, zoomOut, onNodesInitialized, viewport, dimensions, findNode } =
  useVueFlow(flowId)

const isEmpty = computed(() => props.nodes.length === 0)

const fit = () => {
  if (isEmpty.value) return
  return fitView({ padding: 0.2, duration: 300 })
}

// Zoom to the current selection; falls back to fitting everything.
function focusSelected() {
  if (isEmpty.value) return
  if (!props.selectedId) return fit()
  return fitView({ nodes: [props.selectedId], padding: 0.6, duration: 300, maxZoom: 1.4 })
}

function focusMatches() {
  if (isEmpty.value || props.matchIds.size === 0) return
  const ids = props.nodes.map((n) => n.id).filter((id) => props.matchIds.has(id))
  if (ids.length === 0) return
  return fitView({ nodes: ids, padding: 0.9, duration: 400, maxZoom: 1.1 })
}

defineExpose({ fit, focusSelected, focusMatches, zoomIn, zoomOut })

onNodesInitialized(fit)
watch(
  () => props.nodes.map((n) => n.id).join('|'),
  () => nextTick(fit),
)

const flowNodes = computed<Node[]>(() =>
  props.nodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: n.position,
    parentNode: n.parentId,
    class: props.matchIds.has(n.id) ? 'node-match' : '',
    draggable: false,
    selectable: n.selectable ?? true,
    zIndex: n.kind === 'context' ? 0 : 2,
    style: n.size
      ? { width: `${n.size.width}px`, ...(n.size.height ? { height: `${n.size.height}px` } : {}) }
      : undefined,
    data: n.data,
  })),
)

// node geometry (frame members are positioned relative to their frame)
const nodeGeom = computed(() => {
  const byId = new Map(props.nodes.map((n) => [n.id, n]))
  const geom = new Map<string, { x: number; y: number; width: number }>()
  const resolve = (n: GraphNode): { x: number; y: number } => {
    const cached = geom.get(n.id)
    if (cached) return cached
    const parentNode = n.parentId ? byId.get(n.parentId) : undefined
    const parent = parentNode ? resolve(parentNode) : { x: 0, y: 0 }
    return { x: parent.x + n.position.x, y: parent.y + n.position.y }
  }
  for (const n of props.nodes) {
    const p = resolve(n)
    geom.set(n.id, { x: p.x, y: p.y, width: n.size?.width ?? 200 })
  }
  return geom
})

// Give every edge its own handle, spread along the node side and ordered by the
// other endpoints position, plus its own lane for the vertical segment, so
// parallel edges (e.g. parent -> children) don't overlap or cross.
const LANE_GAP = 10
const LANE_BUCKET = 16

const edgePlan = computed(() => {
  const geom = nodeGeom.value
  const absPos = (id: string) => geom.get(id) ?? { x: 0, y: 0, width: 200 }

  const out = new Map<string, GraphEdge[]>()
  const inc = new Map<string, GraphEdge[]>()
  for (const e of props.edges) {
    out.set(e.source, [...(out.get(e.source) ?? []), e])
    inc.set(e.target, [...(inc.get(e.target) ?? []), e])
  }

  const edgeHandles = new Map<string, { sourceHandle?: string; targetHandle?: string }>()
  const planSide = (perNode: Map<string, GraphEdge[]>, side: 'source' | 'target') => {
    const plan = new Map<string, string[]>()
    for (const [nodeId, edges] of perNode) {
      const sorted = [...edges].sort((a, b) => {
        const otherA = absPos(side === 'source' ? a.target : a.source)
        const otherB = absPos(side === 'source' ? b.target : b.source)
        return otherA.y - otherB.y || otherA.x - otherB.x || a.id.localeCompare(b.id)
      })
      const ids = sorted.map((_, i) => `${side}-${i}`)
      plan.set(nodeId, ids)
      sorted.forEach((e, i) => {
        const h = edgeHandles.get(e.id) ?? {}
        h[side === 'source' ? 'sourceHandle' : 'targetHandle'] = ids[i]
        edgeHandles.set(e.id, h)
      })
    }
    return plan
  }

  const intervals = [...geom.values()].map((g) => [g.x, g.x + g.width] as const)
  const isFree = (x: number) => !intervals.some(([a, b]) => x > a - 2 && x < b + 2)

  const TRUNK_PAD = 12
  const lanes = new Map<string, number>()
  const channels = new Map<number, GraphEdge[]>()
  const midXOf = new Map<string, number>()
  const boundsOf = new Map<string, { lo: number; hi: number }>()
  for (const e of props.edges) {
    if (!geom.has(e.source) || !geom.has(e.target)) continue
    const sourceRight = absPos(e.source).x + absPos(e.source).width
    const targetLeft = absPos(e.target).x
    midXOf.set(e.id, (sourceRight + targetLeft) / 2)
    boundsOf.set(e.id, { lo: sourceRight + TRUNK_PAD, hi: targetLeft - TRUNK_PAD })
    const key = Math.round(midXOf.get(e.id)! / LANE_BUCKET)
    channels.set(key, [...(channels.get(key) ?? []), e])
  }
  for (const edges of channels.values()) {
    const sorted = [...edges].sort(
      (a, b) =>
        absPos(a.source).y - absPos(b.source).y ||
        absPos(a.target).y - absPos(b.target).y ||
        a.id.localeCompare(b.id),
    )
    const used = new Set<number>()
    sorted.forEach((e, i) => {
      const mid = midXOf.get(e.id)!
      const { lo, hi } = boundsOf.get(e.id)!
      const stagger = edges.length > 1 ? (i - (sorted.length - 1) / 2) * LANE_GAP : 0
      const desired = mid + stagger
      let laneX = Math.min(Math.max(desired, lo), hi)
      if (!isFree(laneX) || used.has(Math.round(laneX))) {
        for (let d = 1; lo <= hi; d++) {
          const right = desired + d * LANE_GAP
          const left = desired - d * LANE_GAP
          if (right > hi && left < lo) break
          if (right <= hi && isFree(right) && !used.has(Math.round(right))) {
            laneX = right
            break
          }
          if (left >= lo && isFree(left) && !used.has(Math.round(left))) {
            laneX = left
            break
          }
        }
      }
      used.add(Math.round(laneX))
      lanes.set(e.id, laneX - mid)
    })
  }

  return { source: planSide(out, 'source'), target: planSide(inc, 'target'), edgeHandles, lanes }
})

function handlesOf(nodeId: string, side: 'source' | 'target'): string[] {
  return edgePlan.value[side].get(nodeId) ?? [`${side}-0`]
}

const hoveredEdgeId = ref('')
const hoveredNodeId = ref('')

function onEdgeMouseEnter({ edge }: EdgeMouseEvent) {
  hoveredEdgeId.value = edge.id
}

function onEdgeMouseLeave() {
  hoveredEdgeId.value = ''
}

function onNodeMouseEnter({ node }: NodeMouseEvent) {
  hoveredNodeId.value = node.id
}

function onNodeMouseLeave() {
  hoveredNodeId.value = ''
}

const tooltipNodeId = ref('')
let tooltipTimer: ReturnType<typeof setTimeout> | undefined
watch(hoveredNodeId, (id) => {
  clearTimeout(tooltipTimer)
  tooltipNodeId.value = ''
  const node = props.nodes.find((n) => n.id === id)
  if (node && node.kind !== 'context') {
    tooltipTimer = setTimeout(() => (tooltipNodeId.value = id), 250)
  }
})
// avoid a dangling timer writing to a detached ref after unmount
onScopeDispose(() => clearTimeout(tooltipTimer))

const tooltipEl = ref<HTMLElement | null>(null)
const tooltipSize = ref({ w: 288, h: 80 })
watch(
  tooltipNodeId,
  async (id) => {
    if (!id) return
    await nextTick()
    if (tooltipEl.value) {
      tooltipSize.value = { w: tooltipEl.value.offsetWidth, h: tooltipEl.value.offsetHeight }
    }
  },
  { flush: 'post' },
)

const TOOLTIP_GAP = 10
const TOOLTIP_MARGIN = 8

// depends only on nodes, so panning/zooming (which drives `tooltip` via viewport)
// doesn't reallocate this map every frame while a tooltip is open
const nodeById = computed(() => new Map(props.nodes.map((n) => [n.id, n])))

const tooltip = computed(() => {
  const node = props.nodes.find((n) => n.id === tooltipNodeId.value)
  const geom = nodeGeom.value.get(tooltipNodeId.value)
  if (!node || !geom) return null
  const byId = nodeById.value
  const embedded = (node.data as { instanceNames?: string[] }).instanceNames
  const instances = (
    embedded ??
    props.edges
      .filter((e) => e.source === node.id)
      .map((e) => byId.get(e.target))
      .filter((n) => n?.kind === 'instance')
      .map((n) => n!.data.label)
  )
    .slice()
    .sort((a, b) => a.localeCompare(b))

  // api nodes: names of providing/consuming components, derived from the edges
  // (mirrors how instance names are derived above)
  const neighboursOf = (dir: 'in' | 'out') =>
    props.edges
      .filter((e) => (dir === 'in' ? e.target : e.source) === node.id)
      .map((e) => byId.get(dir === 'in' ? e.source : e.target))
      .filter((n) => n?.kind === 'component')
      .map((n) => n!.data.label)
      .sort((a, b) => a.localeCompare(b))
  const providers = node.kind === 'api' ? neighboursOf('in') : []
  const consumers = node.kind === 'api' ? neighboursOf('out') : []

  // Place the tooltip where it fits: above, below, right or left of the node
  const { x, y, zoom } = viewport.value
  const { w, h } = tooltipSize.value
  const W = dimensions.value.width
  const H = dimensions.value.height
  const nodeLeft = x + geom.x * zoom
  const nodeTop = y + geom.y * zoom
  const nodeW = geom.width * zoom
  const nodeH = (findNode(node.id)?.dimensions.height ?? 64) * zoom
  const centerX = nodeLeft + nodeW / 2
  const centerY = nodeTop + nodeH / 2

  const candidates = [
    { left: centerX - w / 2, top: nodeTop - TOOLTIP_GAP - h, space: nodeTop - TOOLTIP_MARGIN },
    {
      left: centerX - w / 2,
      top: nodeTop + nodeH + TOOLTIP_GAP,
      space: H - TOOLTIP_MARGIN - (nodeTop + nodeH),
    },
    {
      left: nodeLeft + nodeW + TOOLTIP_GAP,
      top: centerY - h / 2,
      space: W - TOOLTIP_MARGIN - (nodeLeft + nodeW),
    },
    {
      left: nodeLeft - TOOLTIP_GAP - w,
      top: centerY - h / 2,
      space: nodeLeft - TOOLTIP_MARGIN,
    },
  ]
  const fits = (c: (typeof candidates)[number]) =>
    c.left >= TOOLTIP_MARGIN &&
    c.top >= TOOLTIP_MARGIN &&
    c.left + w <= W - TOOLTIP_MARGIN &&
    c.top + h <= H - TOOLTIP_MARGIN
  const placement =
    candidates.find(fits) ?? candidates.reduce((best, c) => (c.space > best.space ? c : best))
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), Math.max(min, max))
  const left = clamp(placement.left, TOOLTIP_MARGIN, W - w - TOOLTIP_MARGIN)
  const top = clamp(placement.top, TOOLTIP_MARGIN, H - h - TOOLTIP_MARGIN)

  return {
    node,
    instances,
    providers,
    consumers,
    incoming: edgePlan.value.target.get(node.id)?.length ?? 0,
    outgoing: edgePlan.value.source.get(node.id)?.length ?? 0,
    style: { left: `${left}px`, top: `${top}px` },
  }
})

const flowEdges = computed<Edge[]>(() =>
  props.edges.map((e) => {
    const isActive = e.source === props.selectedId || e.target === props.selectedId
    const isHovered =
      hoveredEdgeId.value === e.id ||
      e.source === hoveredNodeId.value ||
      e.target === hoveredNodeId.value
    const isDim = !!props.selectedId && !isActive
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: edgePlan.value.edgeHandles.get(e.id)?.sourceHandle ?? e.sourceHandle,
      targetHandle: edgePlan.value.edgeHandles.get(e.id)?.targetHandle ?? e.targetHandle,
      type: 'channel',
      data: { lane: edgePlan.value.lanes.get(e.id) ?? 0 },
      class: [
        e.kind === 'consumes' ? 'edge-consumes' : e.kind === 'provides' ? 'edge-provides' : '',
        isActive ? 'edge-active' : '',
        isHovered ? 'edge-hovered' : '',
        isDim ? 'edge-dim' : '',
      ]
        .filter(Boolean)
        .join(' '),
      zIndex: isActive || isHovered ? 1 : 0,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color:
          isActive || isHovered
            ? 'var(--color-accent)'
            : isDim
              ? 'color-mix(in srgb, var(--color-text-3) 45%, transparent)'
              : 'var(--color-text-3)',
      },
    }
  }),
)

const neighbourIds = computed(() => {
  const ids = new Set<string>()
  if (!props.selectedId) return ids
  for (const e of props.edges) {
    if (e.source === props.selectedId) ids.add(e.target)
    else if (e.target === props.selectedId) ids.add(e.source)
  }
  return ids
})

function isOwnedBySelection(data: unknown): boolean {
  const parent = (data as InstanceNodeData).parent
  return !!parent && parent === props.selectedId
}

function onNodeClick({ node }: NodeMouseEvent) {
  if (node.type === 'context') {
    fitView({ nodes: [node.id], padding: 0.3, duration: 300, maxZoom: 1.2 })
  }
  emit('node-click', { id: node.id, kind: node.type as GraphNodeKind })
}
</script>

<template>
  <div class="emel-flow relative h-full w-full">
    <div
      v-if="isEmpty"
      class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-text-4"
    >
      <IconCircleOff
        :size="20"
        :stroke-width="1.5"
      />
      <span class="text-label">Nothing to show for the current filters</span>
    </div>
    <VueFlow
      :id="flowId"
      :nodes="flowNodes"
      :edges="flowEdges"
      :fit-view-on-init="true"
      :min-zoom="0.2"
      :max-zoom="1.5"
      :nodes-draggable="false"
      :elevate-edges-on-select="false"
      @node-click="onNodeClick"
      @node-mouse-enter="onNodeMouseEnter"
      @node-mouse-leave="onNodeMouseLeave"
      @edge-mouse-enter="onEdgeMouseEnter"
      @edge-mouse-leave="onEdgeMouseLeave"
    >
      <Background
        variant="lines"
        :gap="88"
        :size="1"
        pattern-color="rgba(128, 128, 128, 0.10)"
      />
      <Controls
        v-if="showControls"
        :show-interactive="false"
        position="bottom-left"
      />

      <template #edge-channel="edgeProps">
        <ChannelEdge v-bind="edgeProps" />
      </template>

      <!-- Context / unmapped frame -->
      <template #node-context="{ data }">
        <div
          class="frame h-full w-full cursor-pointer"
          :class="
            (data as ContextNodeData).variant === 'unmapped' ? 'frame--unmapped' : 'frame--context'
          "
        >
          <div
            class="frame-tab mx-2 mt-2 inline-flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-mono text-micro font-semibold uppercase tracking-wide"
            :title="
              (data as ContextNodeData).variant === 'unmapped'
                ? 'Unmapped instances with no resolvable parent — click to focus and inspect'
                : 'Click to focus this group'
            "
          >
            <IconAlertTriangle
              v-if="(data as ContextNodeData).variant === 'unmapped'"
              :size="11"
              :stroke-width="2.5"
              class="shrink-0"
            />
            <span class="truncate">{{ (data as ContextNodeData).label }}</span>
            <span
              v-if="(data as ContextNodeData).count"
              class="frame-count shrink-0 rounded-full px-1 py-px tabular-nums"
            >
              {{ (data as ContextNodeData).count }}
            </span>
          </div>
        </div>
      </template>

      <!-- Context node -->
      <template #node-context-node="{ id, data }">
        <div
          class="node-cut node-comp w-full cursor-pointer px-3 py-2"
          :class="id === selectedId ? 'node-comp-selected' : ''"
        >
          <div class="flex items-center gap-2">
            <span class="truncate text-body font-medium text-text-1">
              {{ (data as ContextItemNodeData).label }}
            </span>
            <span
              v-if="(data as ContextItemNodeData).findings"
              class="node-findings ml-auto flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
            >
              <IconAlertTriangle
                :size="10"
                :stroke-width="2"
              />
              {{ (data as ContextItemNodeData).findings }}
            </span>
          </div>
          <div class="mt-0.5 flex items-center gap-1.5 font-mono text-micro text-text-2">
            <span
              v-if="(data as ContextItemNodeData).type"
              class="shrink-0 rounded-sm bg-bg-0 px-1 text-text-3"
            >
              C
            </span>
            <span class="truncate">{{ (data as ContextItemNodeData).type }}</span>
            <span
              v-if="(data as ContextItemNodeData).instances"
              class="ml-auto shrink-0 tabular-nums"
            >
              {{ (data as ContextItemNodeData).instances }} inst
            </span>
          </div>
        </div>
        <FlowHandles
          type="target"
          :position="Position.Left"
          :handles="handlesOf(id, 'target')"
        />
        <FlowHandles
          type="source"
          :position="Position.Right"
          :handles="handlesOf(id, 'source')"
        />
      </template>

      <!-- System node -->
      <template #node-system="{ id, data }">
        <div
          class="node-cut node-comp w-full cursor-pointer px-3 py-2"
          :class="id === selectedId ? 'node-comp-selected' : ''"
        >
          <div class="flex items-center gap-2">
            <span class="truncate text-body font-medium text-text-1">
              {{ (data as SystemNodeData).label }}
            </span>
            <span
              v-if="(data as SystemNodeData).findings"
              class="node-findings ml-auto flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
            >
              <IconAlertTriangle
                :size="10"
                :stroke-width="2"
              />
              {{ (data as SystemNodeData).findings }}
            </span>
          </div>
          <div class="mt-0.5 flex items-center gap-1.5 font-mono text-micro text-text-2">
            <span class="shrink-0 rounded-sm bg-bg-0 px-1 text-text-3">
              {{ (data as SystemNodeData).abstract ? 'A' : 'C' }}
            </span>
            <span class="truncate">
              {{ (data as SystemNodeData).abstract ? 'Abstract' : 'Concrete' }}
            </span>
            <span
              v-if="(data as SystemNodeData).version"
              class="shrink-0"
            >
              v{{ (data as SystemNodeData).version }}
            </span>
          </div>
        </div>
        <FlowHandles
          type="target"
          :position="Position.Left"
          :handles="handlesOf(id, 'target')"
        />
        <FlowHandles
          type="source"
          :position="Position.Right"
          :handles="handlesOf(id, 'source')"
        />
      </template>

      <template #node-instance="{ id, data }">
        <!-- unmapped instance: no resolvable parent, rendered as a standalone node -->
        <div
          v-if="(data as InstanceNodeData).unmapped"
          class="node-inst-unmapped flex h-full w-full cursor-pointer flex-col justify-center px-3"
          :class="id === selectedId ? 'node-inst-unmapped-selected' : ''"
        >
          <div class="flex items-center gap-2">
            <div class="min-w-0 flex-1 truncate text-body text-text-2">
              {{ (data as InstanceNodeData).label }}
            </div>
            <MappingTag
              :state="(data as InstanceNodeData).unresolved ? 'unresolved' : 'unmapped'"
            />
          </div>
          <div
            v-if="(data as InstanceNodeData).context"
            class="mt-0.5 flex items-center gap-1 font-mono text-micro text-text-3"
          >
            <span class="shrink-0 rounded-sm bg-bg-3 px-1 text-text-3">C</span>
            <span class="truncate">{{ (data as InstanceNodeData).context }}</span>
          </div>
        </div>
        <div
          v-else
          class="node-cut node-inst w-full cursor-pointer"
          :class="
            id === selectedId
              ? 'node-inst-selected'
              : isOwnedBySelection(data)
                ? 'node-inst-owned'
                : ''
          "
        >
          <div class="node-cut-inner px-3 py-2">
            <div class="truncate text-body text-text-2">{{ (data as InstanceNodeData).label }}</div>
            <div
              v-if="(data as InstanceNodeData).context"
              class="mt-0.5 flex items-center gap-1 font-mono text-micro text-text-3"
            >
              <span class="shrink-0 rounded-sm bg-bg-3 px-1 text-text-3">C</span>
              <span class="truncate">{{ (data as InstanceNodeData).context }}</span>
            </div>
            <div
              v-else-if="(data as InstanceNodeData).system"
              class="mt-0.5 flex items-center gap-1 font-mono text-micro text-text-3"
            >
              <span class="shrink-0 rounded-sm bg-bg-3 px-1 text-text-3">S</span>
              <span class="truncate">{{ (data as InstanceNodeData).system }}</span>
            </div>
          </div>
        </div>
        <FlowHandles
          type="target"
          :position="Position.Left"
          :handles="handlesOf(id, 'target')"
        />
      </template>

      <template #node-api="{ id, data }">
        <div
          class="flex h-full w-full cursor-pointer items-center gap-2 rounded-full border bg-bg-1 px-4 py-2 transition-colors"
          :class="id === selectedId || neighbourIds.has(id) ? 'border-accent' : 'border-text-4'"
        >
          <span class="min-w-0 flex-1 truncate text-body text-text-1">
            {{ (data as ApiNodeData).label }}
          </span>
          <span
            v-if="(data as ApiNodeData).findings"
            class="flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
          >
            <IconAlertTriangle
              :size="10"
              :stroke-width="2"
            />
            {{ (data as ApiNodeData).findings }}
          </span>
          <span
            v-if="(data as ApiNodeData).crosses"
            class="flex shrink-0 items-center gap-1 rounded-full border border-border-2 bg-bg-2 px-1.5 py-0.5 font-mono text-micro tabular-nums text-text-3"
            title="Crosses a context boundary"
          >
            <IconArrowsExchange
              :size="10"
              :stroke-width="2"
            />
            {{ (data as ApiNodeData).crossCount }}
          </span>
          <span
            v-if="(data as ApiNodeData).version"
            class="shrink-0 font-mono text-micro text-text-4"
          >
            v{{ (data as ApiNodeData).version }}
          </span>
        </div>
        <FlowHandles
          type="target"
          :position="Position.Left"
          :handles="handlesOf(id, 'target')"
        />
        <FlowHandles
          type="source"
          :position="Position.Right"
          :handles="handlesOf(id, 'source')"
        />
      </template>

      <!-- Component node -->
      <template #node-component="{ id, data }">
        <div
          class="node-cut node-comp w-full cursor-pointer px-3 py-2"
          :class="id === selectedId ? 'node-comp-selected' : ''"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="truncate text-body font-medium text-text-1">
                {{ (data as ComponentNodeData).label }}
              </span>
              <span
                v-if="(data as ComponentNodeData).findings"
                class="node-findings ml-auto flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
              >
                <IconAlertTriangle
                  :size="10"
                  :stroke-width="2"
                />
                {{ (data as ComponentNodeData).findings }}
              </span>
            </div>
            <div
              v-if="(data as ComponentNodeData).system"
              class="mt-0.5 flex items-center gap-1 font-mono text-micro text-text-2"
            >
              <span class="shrink-0 rounded-sm bg-bg-0 px-1 text-text-3">S</span>
              <span class="truncate">{{ (data as ComponentNodeData).system }}</span>
            </div>
          </div>
        </div>
        <FlowHandles
          type="target"
          :position="Position.Left"
          :handles="handlesOf(id, 'target')"
        />
        <FlowHandles
          type="source"
          :position="Position.Right"
          :handles="handlesOf(id, 'source')"
        />
      </template>
    </VueFlow>

    <div
      v-if="tooltip"
      ref="tooltipEl"
      class="tooltip-wrap pointer-events-none absolute z-20"
      :style="tooltip.style"
    >
      <NodeTooltip
        :node="tooltip.node"
        :incoming="tooltip.incoming"
        :outgoing="tooltip.outgoing"
        :instances="tooltip.instances"
        :providers="tooltip.providers"
        :consumers="tooltip.consumers"
      />
    </div>
  </div>
</template>

<style scoped>
.emel-flow :deep(.vue-flow__node.node-match) {
  box-shadow:
    0 0 0 4px var(--color-bg-0),
    0 0 0 7px var(--color-match);
  border-radius: 4px;
}

.emel-flow :deep(.vue-flow__background pattern path),
.emel-flow :deep(.vue-flow__background pattern line) {
  stroke: color-mix(in srgb, var(--color-border-1) 45%, transparent);
}
.emel-flow :deep(.vue-flow__background pattern circle) {
  fill: color-mix(in srgb, var(--color-border-1) 45%, transparent);
}

.node-cut {
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
}

.frame {
  border-radius: 8px;
  transition:
    background-color 150ms,
    border-color 150ms;
}

.frame--context {
  background: color-mix(in srgb, var(--color-text-4) 4%, transparent);
}
.frame--context:hover {
  background: color-mix(in srgb, var(--color-text-4) 7%, transparent);
}

.frame--unmapped {
  border: 1.5px dashed color-mix(in srgb, var(--color-warning) 55%, transparent);
  background: color-mix(in srgb, var(--color-warning) 5%, transparent);
}
.frame--unmapped:hover {
  border-color: color-mix(in srgb, var(--color-warning) 80%, transparent);
  background: color-mix(in srgb, var(--color-warning) 8%, transparent);
}

.frame-tab {
  background: color-mix(in srgb, var(--color-text-3) 12%, var(--color-bg-0));
  color: var(--color-text-3);
  transition:
    background-color 150ms,
    color 150ms;
}
.frame--context .frame-tab:hover {
  background: color-mix(in srgb, var(--color-text-3) 20%, var(--color-bg-0));
  color: var(--color-text-2);
}
.frame--unmapped .frame-tab {
  background: color-mix(in srgb, var(--color-warning) 16%, var(--color-bg-0));
  color: var(--color-warning);
}
.frame--unmapped .frame-tab:hover {
  background: color-mix(in srgb, var(--color-warning) 26%, var(--color-bg-0));
}

.frame-count {
  background: color-mix(in srgb, var(--color-text-3) 22%, var(--color-bg-0));
}
.frame--unmapped .frame-count {
  background: color-mix(in srgb, var(--color-warning) 26%, var(--color-bg-0));
}

.node-cut-inner {
  clip-path: polygon(
    2px 2px,
    calc(100% - 15px) 2px,
    calc(100% - 2px) 15px,
    calc(100% - 2px) calc(100% - 2px),
    2px calc(100% - 2px)
  );
}

.node-comp,
.node-inst,
.node-inst > .node-cut-inner {
  transition: background-color 150ms;
}

.node-comp {
  --node-comp-fill: var(--color-text-4);
  background: var(--node-comp-fill);
}

[data-theme='light'] .node-comp {
  --node-comp-fill: color-mix(in srgb, var(--color-text-4) 72%, #fff);
}
.node-comp:hover {
  background: color-mix(in srgb, var(--node-comp-fill) 80%, var(--color-accent));
}
.node-comp-selected,
.node-comp-selected:hover {
  background: color-mix(in srgb, var(--node-comp-fill) 45%, var(--color-accent));
}

.node-comp-selected .node-findings {
  background-color: var(--color-bg-1);
  border-color: var(--color-warning);
}

.node-inst {
  background: var(--color-text-4);
}
.node-inst > .node-cut-inner {
  background: var(--color-bg-1);
}
.node-inst:hover > .node-cut-inner {
  background: color-mix(in srgb, var(--color-bg-1) 90%, var(--color-accent));
}
.node-inst-owned {
  background: var(--color-accent);
}
.node-inst-owned > .node-cut-inner {
  background: color-mix(in srgb, var(--color-bg-1) 86%, var(--color-accent));
}
.node-inst-selected {
  background: var(--color-accent);
}
.node-inst-selected > .node-cut-inner,
.node-inst-selected:hover > .node-cut-inner {
  background: color-mix(in srgb, var(--color-bg-1) 68%, var(--color-accent));
}

/* unmapped instances */
.node-inst-unmapped {
  border: 1.5px dashed var(--color-text-3);
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-bg-2) 70%, transparent);
  transition:
    border-color 150ms,
    background-color 150ms;
}
.node-inst-unmapped:hover {
  border-color: var(--color-text-2);
  background: color-mix(in srgb, var(--color-bg-2) 85%, transparent);
}
.node-inst-unmapped-selected,
.node-inst-unmapped-selected:hover {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-bg-1) 68%, var(--color-accent));
}

.emel-flow :deep(.vue-flow__node) {
  animation: flow-fade-in 180ms ease-out;
  transition: box-shadow 200ms;
}
.emel-flow :deep(.vue-flow__edge) {
  animation: flow-fade-in 240ms ease-out 60ms backwards;
  cursor: default;
}
@keyframes flow-fade-in {
  from {
    opacity: 0;
  }
}

.tooltip-wrap {
  width: 288px;
  max-width: calc(100% - 16px);
  max-height: calc(100% - 16px);
  overflow: hidden;
  animation: flow-fade-in 150ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .emel-flow :deep(.vue-flow__node),
  .emel-flow :deep(.vue-flow__edge) {
    animation: none;
  }
}

.emel-flow :deep(.vue-flow__edge-path) {
  stroke: var(--color-text-3, rgba(120, 140, 130, 0.8));
  stroke-width: 1.5;
  transition:
    stroke 150ms,
    stroke-width 150ms,
    stroke-opacity 150ms;
}
.emel-flow :deep(.vue-flow__edge.edge-consumes .vue-flow__edge-path) {
  stroke-dasharray: 5 4;
}
.emel-flow :deep(.vue-flow__edge.edge-hovered .vue-flow__edge-path),
.emel-flow :deep(.vue-flow__edge.edge-active .vue-flow__edge-path) {
  stroke: var(--color-accent);
  stroke-width: 2;
}
.emel-flow :deep(.vue-flow__edge.edge-dim .vue-flow__edge-path) {
  stroke-opacity: 0.45;
}
.emel-flow :deep(.vue-flow__handle) {
  width: 6px;
  height: 6px;
  border: none;
  background: var(--color-border-2, rgba(120, 140, 130, 0.7));
}
.emel-flow :deep(.vue-flow__controls) {
  box-shadow: none;
}
.emel-flow :deep(.vue-flow__controls-button) {
  border: 1px solid var(--color-border-2, rgba(120, 140, 130, 0.4));
  background: var(--color-bg-1, #1a1a1a);
  fill: var(--color-text-3, #999);
  transition: background-color 150ms;
}
.emel-flow :deep(.vue-flow__controls-button:hover) {
  background: var(--color-bg-2, #222);
}
</style>
