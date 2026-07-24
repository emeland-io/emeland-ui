<script setup lang="ts">
import { computed, watch, nextTick, useId } from 'vue'
import { IconAlertTriangle } from '@tabler/icons-vue'
import {
  VueFlow,
  useVueFlow,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeMouseEvent,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import type {
  GraphNode,
  GraphEdge,
  GraphNodeKind,
  SystemNodeData,
  InstanceNodeData,
  ContextNodeData,
  ApiNodeData,
  ComponentNodeData,
} from '@/types/graph'

const props = defineProps<{
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedId?: string
}>()

const emit = defineEmits<{
  'node-click': [payload: { id: string; kind: GraphNodeKind }]
}>()

const flowId = `flow-${useId()}`
const { fitView, zoomIn, zoomOut, onNodesInitialized } = useVueFlow(flowId)

const fit = () => fitView({ padding: 0.2, duration: 300 })

function focusSelected() {
  if (!props.selectedId) return fit()
  return fitView({ nodes: [props.selectedId], padding: 0.6, duration: 300, maxZoom: 1.4 })
}

defineExpose({ fit, focusSelected, zoomIn, zoomOut })

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
    draggable: false,
    selectable: n.selectable ?? true,
    style: n.size
      ? { width: `${n.size.width}px`, ...(n.size.height ? { height: `${n.size.height}px` } : {}) }
      : undefined,
    data: n.data,
  })),
)

const flowEdges = computed<Edge[]>(() =>
  props.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    class: [
      e.kind === 'consumes' ? 'edge-consumes' : e.kind === 'provides' ? 'edge-provides' : '',
      e.kind === 'contains' && e.source === props.selectedId ? 'edge-owned' : '',
    ]
      .filter(Boolean)
      .join(' '),
    markerEnd: MarkerType.ArrowClosed,
  })),
)

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
    >
      <Background
        :gap="20"
        :size="1"
        pattern-color="rgba(128, 128, 128, 0.18)"
      />
      <Controls
        :show-interactive="false"
        position="bottom-left"
      />

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

      <!-- System node -->
      <template #node-system="{ data }">
        <div
          class="w-56 cursor-pointer rounded-md border border-border-2 bg-bg-2 px-3 py-2 shadow-sm transition-colors hover:border-accent"
          title="Open system"
        >
          <div class="truncate text-body font-medium text-text-1">
            {{ (data as SystemNodeData).label }}
          </div>
          <div class="mt-1 flex items-center gap-1.5">
            <span
              class="rounded px-1.5 py-0.5 font-mono text-micro"
              :class="
                (data as SystemNodeData).abstract
                  ? 'bg-bg-2 text-text-3'
                  : 'bg-accent/10 text-accent'
              "
            >
              {{ (data as SystemNodeData).abstract ? 'Abstract' : 'Concrete' }}
            </span>
            <span
              v-if="(data as SystemNodeData).version"
              class="font-mono text-micro text-text-4"
            >
              v{{ (data as SystemNodeData).version }}
            </span>
            <span
              v-if="(data as SystemNodeData).findings"
              class="flex items-center gap-1 rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
              :title="`${(data as SystemNodeData).findings} finding(s)`"
            >
              <IconAlertTriangle
                :size="10"
                :stroke-width="2"
              />
              {{ (data as SystemNodeData).findings }}
            </span>
          </div>
        </div>
        <Handle
          type="source"
          :position="Position.Right"
        />
      </template>

      <template #node-instance="{ id, data }">
        <div
          class="node-cut w-full cursor-pointer px-3 py-2 transition-colors"
          :class="
            id === selectedId
              ? 'bg-accent/25'
              : isOwnedBySelection(data)
                ? 'bg-accent/10 hover:bg-accent/20'
                : 'bg-bg-2 hover:bg-bg-3'
          "
          title="Open instance"
        >
          <div class="truncate text-body text-text-2">{{ (data as InstanceNodeData).label }}</div>
          <div
            v-if="(data as InstanceNodeData).context"
            class="mt-0.5 flex items-center gap-1 font-mono text-micro text-text-4"
          >
            <span class="shrink-0 rounded-sm bg-bg-3 px-1 text-text-3">C</span>
            <span class="truncate">{{ (data as InstanceNodeData).context }}</span>
          </div>
        </div>
        <Handle
          type="target"
          :position="Position.Left"
        />
      </template>

      <!-- API node: a capsule, so interfaces read differently from the angular
           component/instance blocks even at low zoom -->
      <template #node-api="{ data }">
        <div
          class="flex h-full w-full items-center gap-2 rounded-full border border-border-2 bg-bg-1 px-4 shadow-sm"
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
        <Handle
          type="target"
          :position="Position.Left"
        />
        <Handle
          type="source"
          :position="Position.Right"
        />
      </template>

      <!-- Component node -->
      <template #node-component="{ id, data }">
        <div
          class="node-cut w-full cursor-pointer transition-colors"
          :class="id === selectedId ? 'bg-accent' : 'bg-border-2 hover:bg-accent/60'"
          title="Open component"
        >
          <div class="node-cut-inner bg-bg-2 px-3 py-2">
            <div class="flex items-center gap-2">
              <span class="truncate text-body font-medium text-text-1">
                {{ (data as ComponentNodeData).label }}
              </span>
              <span
                v-if="(data as ComponentNodeData).instanceCount"
                class="ml-auto shrink-0 rounded-full bg-bg-3 px-1.5 py-0.5 font-mono text-micro text-text-3"
                :title="`${(data as ComponentNodeData).instanceCount} instance(s)`"
              >
                {{ (data as ComponentNodeData).instanceCount }}
              </span>
            </div>
            <div
              v-if="(data as ComponentNodeData).system"
              class="mt-0.5 flex items-center gap-1 font-mono text-micro text-text-4"
            >
              <span class="shrink-0 rounded-sm bg-bg-3 px-1 text-text-3">S</span>
              <span class="truncate">{{ (data as ComponentNodeData).system }}</span>
            </div>
          </div>
        </div>
        <Handle
          type="target"
          :position="Position.Left"
        />
        <Handle
          type="source"
          :position="Position.Right"
        />
      </template>
    </VueFlow>
  </div>
</template>

<style scoped>
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

.emel-flow :deep(.vue-flow__edge-path) {
  stroke: var(--color-text-3, rgba(120, 140, 130, 0.8));
  stroke-width: 1.5;
}
.emel-flow :deep(.vue-flow__edge.edge-consumes .vue-flow__edge-path) {
  stroke-dasharray: 5 4;
}
.emel-flow :deep(.vue-flow__edge.edge-owned .vue-flow__edge-path) {
  stroke: var(--color-accent);
}
.emel-flow :deep(.vue-flow__edge.edge-owned .vue-flow__arrowhead) {
  fill: var(--color-accent);
}
.emel-flow :deep(.vue-flow__arrowhead) {
  fill: var(--color-text-3, rgba(120, 140, 130, 0.8));
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
}
.emel-flow :deep(.vue-flow__controls-button:hover) {
  background: var(--color-bg-2, #222);
}
</style>
