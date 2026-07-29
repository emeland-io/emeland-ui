<script setup lang="ts">
import { computed, ref, watch, nextTick, useId } from 'vue'
import { IconAlertTriangle, IconCircleOff } from '@tabler/icons-vue'
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
const { fitView, zoomIn, zoomOut, onNodesInitialized } = useVueFlow(flowId)

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
    style: n.size
      ? { width: `${n.size.width}px`, ...(n.size.height ? { height: `${n.size.height}px` } : {}) }
      : undefined,
    data: n.data,
  })),
)

// Give every edge its own handle, spread along the node side and ordered by the
// other endpoints position, plus its own lane for the vertical segment, so
// parallel edges (e.g. parent -> children) don't overlap or cross.
const LANE_GAP = 10
const LANE_BUCKET = 16

const edgePlan = computed(() => {
  const byId = new Map(props.nodes.map((n) => [n.id, n]))
  // Absolute positions (frame members are positioned relative to their frame)
  const abs = new Map<string, { x: number; y: number }>()
  const absPos = (id: string): { x: number; y: number } => {
    const cached = abs.get(id)
    if (cached) return cached
    const n = byId.get(id)
    if (!n) return { x: 0, y: 0 }
    const parent = n.parentId ? absPos(n.parentId) : { x: 0, y: 0 }
    const pos = { x: parent.x + n.position.x, y: parent.y + n.position.y }
    abs.set(id, pos)
    return pos
  }

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

  // Stagger the vertical segment of edges that share the same channel
  const lanes = new Map<string, number>()
  const channels = new Map<number, GraphEdge[]>()
  for (const e of props.edges) {
    const source = byId.get(e.source)
    if (!source || !byId.has(e.target)) continue
    const sourceRight = absPos(e.source).x + (source.size?.width ?? 200)
    const midX = (sourceRight + absPos(e.target).x) / 2
    const key = Math.round(midX / LANE_BUCKET)
    channels.set(key, [...(channels.get(key) ?? []), e])
  }
  for (const edges of channels.values()) {
    if (edges.length < 2) continue
    const sorted = [...edges].sort(
      (a, b) =>
        absPos(a.source).y - absPos(b.source).y ||
        absPos(a.target).y - absPos(b.target).y ||
        a.id.localeCompare(b.id),
    )
    sorted.forEach((e, i) => lanes.set(e.id, (i - (sorted.length - 1) / 2) * LANE_GAP))
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

      <!-- Context frame -->
      <template #node-context="{ data }">
        <div class="h-full w-full rounded-lg border border-dashed border-border-2 bg-transparent">
          <div
            class="truncate px-2.5 pt-1.5 font-mono text-micro font-semibold uppercase tracking-wide text-text-4"
          >
            {{ (data as ContextNodeData).label }}
          </div>
        </div>
      </template>

      <!-- Context node -->
      <template #node-context-node="{ id, data }">
        <div
          class="node-cut node-comp w-full cursor-pointer px-3 py-2"
          :class="id === selectedId ? 'node-comp-selected' : ''"
          :title="(data as ContextItemNodeData).label"
        >
          <div class="flex items-center gap-2">
            <span class="truncate text-body font-medium text-text-1">
              {{ (data as ContextItemNodeData).label }}
            </span>
            <span
              v-if="(data as ContextItemNodeData).findings"
              class="ml-auto flex shrink-0 items-center gap-1 rounded-full badge-warning px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning ring-1 ring-warning/40"
              :title="`${(data as ContextItemNodeData).findings} finding(s)`"
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
              :title="`${(data as ContextItemNodeData).instances} instance(s)`"
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
          :title="(data as SystemNodeData).label"
        >
          <div class="flex items-center gap-2">
            <span class="truncate text-body font-medium text-text-1">
              {{ (data as SystemNodeData).label }}
            </span>
            <span
              v-if="(data as SystemNodeData).findings"
              class="ml-auto flex shrink-0 items-center gap-1 rounded-full badge-warning px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning ring-1 ring-warning/40"
              :title="`${(data as SystemNodeData).findings} finding(s)`"
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
        <div
          class="node-cut node-inst w-full cursor-pointer"
          :class="
            id === selectedId
              ? 'node-inst-selected'
              : isOwnedBySelection(data)
                ? 'node-inst-owned'
                : ''
          "
          :title="(data as InstanceNodeData).label"
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
          class="flex h-full w-full items-center gap-2 rounded-full border bg-bg-1 px-4 transition-colors"
          :class="neighbourIds.has(id) ? 'border-accent' : 'border-text-4'"
          :title="(data as ApiNodeData).label"
        >
          <span class="min-w-0 flex-1 truncate text-body text-text-1">
            {{ (data as ApiNodeData).label }}
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
          :title="(data as ComponentNodeData).label"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="truncate text-body font-medium text-text-1">
                {{ (data as ComponentNodeData).label }}
              </span>
              <span
                v-if="(data as ComponentNodeData).findings"
                class="badge-warning ml-auto flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning ring-1 ring-warning/40"
                :title="`${(data as ComponentNodeData).findings} finding(s)`"
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
  </div>
</template>

<style scoped>
.badge-warning {
  background: color-mix(in srgb, var(--color-bg-0) 88%, var(--color-warning));
}

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
