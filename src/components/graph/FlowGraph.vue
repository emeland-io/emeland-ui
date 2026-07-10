<script setup lang="ts">
import { computed, watch, nextTick, useId } from 'vue'
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
const { fitView, onNodesInitialized } = useVueFlow(flowId)

const fit = () => fitView({ padding: 0.2, duration: 300 })

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
    class: e.kind === 'consumes' ? 'edge-consumes' : e.kind === 'provides' ? 'edge-provides' : '',
    markerEnd: MarkerType.ArrowClosed,
  })),
)

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
            class="truncate px-2.5 pt-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-text-4"
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
          <div class="truncate text-sm font-medium text-text-1">
            {{ (data as SystemNodeData).label }}
          </div>
          <div class="mt-1 flex items-center gap-1.5">
            <span
              class="rounded px-1.5 py-0.5 font-mono text-[10px]"
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
              class="font-mono text-[10px] text-text-4"
            >
              v{{ (data as SystemNodeData).version }}
            </span>
          </div>
        </div>
        <Handle
          type="source"
          :position="Position.Right"
        />
      </template>

      <!-- Instance node -->
      <template #node-instance="{ id, data }">
        <div
          class="w-full cursor-pointer rounded-md border bg-bg-1 px-3 py-2 shadow-sm transition-colors"
          :class="
            id === selectedId
              ? 'border-accent ring-1 ring-accent/40'
              : 'border-border-1 hover:border-border-2'
          "
        >
          <div class="truncate text-sm text-text-1">{{ (data as InstanceNodeData).label }}</div>
          <div
            v-if="(data as InstanceNodeData).cluster || (data as InstanceNodeData).namespace"
            class="mt-1 truncate font-mono text-[10px] text-text-4"
          >
            <span v-if="(data as InstanceNodeData).cluster">
              {{ (data as InstanceNodeData).cluster }}
            </span>
            <span v-if="(data as InstanceNodeData).cluster && (data as InstanceNodeData).namespace">
              /
            </span>
            <span v-if="(data as InstanceNodeData).namespace">
              {{ (data as InstanceNodeData).namespace }}
            </span>
          </div>
        </div>
        <Handle
          type="target"
          :position="Position.Left"
        />
      </template>

      <!-- API node -->
      <template #node-api="{ data }">
        <div class="w-52 rounded-md border border-border-2 bg-bg-1 px-3 py-2 shadow-sm">
          <div class="truncate text-sm text-text-1">{{ (data as ApiNodeData).label }}</div>
          <div
            v-if="(data as ApiNodeData).version"
            class="mt-1 font-mono text-[10px] text-text-4"
          >
            v{{ (data as ApiNodeData).version }}
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

      <!-- Component node -->
      <template #node-component="{ id, data }">
        <div
          class="w-52 cursor-pointer rounded-md border bg-bg-2 px-3 py-2 shadow-sm transition-colors"
          :class="
            id === selectedId
              ? 'border-accent ring-1 ring-accent/40'
              : 'border-border-2 hover:border-accent'
          "
          title="Open component"
        >
          <div class="truncate text-sm font-medium text-text-1">
            {{ (data as ComponentNodeData).label }}
          </div>
          <div
            v-if="(data as ComponentNodeData).system"
            class="mt-0.5 truncate font-mono text-[10px] text-text-4"
          >
            {{ (data as ComponentNodeData).system }}
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
.emel-flow :deep(.vue-flow__edge-path) {
  stroke: var(--color-text-3, rgba(120, 140, 130, 0.8));
  stroke-width: 1.5;
}
.emel-flow :deep(.vue-flow__edge.edge-consumes .vue-flow__edge-path) {
  stroke-dasharray: 5 4;
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
