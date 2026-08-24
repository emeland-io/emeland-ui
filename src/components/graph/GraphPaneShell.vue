<script setup lang="ts">
import { ref } from 'vue'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import GraphLegend, { type LegendItem } from '@/components/graph/GraphLegend.vue'
import type { GraphEdge, GraphNode, GraphNodeClick } from '@/types/graph'

/**
 * Shared shell of the resource graph panes: FlowGraph wiring + legend,
 * with the pane's graph controls exposed to the parent view
 */
withDefaults(
  defineProps<{
    nodes: GraphNode[]
    edges: GraphEdge[]
    selectedId?: string
    showControls?: boolean
    matchIds?: Set<string>
    cursorId?: string
    suspendCursorFollow?: boolean
    legendColumns: LegendItem[][]
  }>(),
  {
    selectedId: '',
    showControls: true,
    matchIds: () => new Set<string>(),
    cursorId: '',
    suspendCursorFollow: false,
  },
)

const emit = defineEmits<{
  'node-click': [click: GraphNodeClick]
}>()

const graph = ref<InstanceType<typeof FlowGraph> | null>(null)

defineExpose({
  fit: () => graph.value?.fit(),
  focusSelected: () => graph.value?.focusSelected(),
  focusMatches: () => graph.value?.focusMatches(),
  zoomIn: () => graph.value?.zoomIn(),
  zoomOut: () => graph.value?.zoomOut(),
})
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col">
    <FlowGraph
      ref="graph"
      :show-controls="showControls"
      :match-ids="matchIds"
      :nodes="nodes"
      :edges="edges"
      :selected-id="selectedId"
      :cursor-id="cursorId"
      :suspend-cursor-follow="suspendCursorFollow"
      class="min-h-0 flex-1"
      @node-click="emit('node-click', $event)"
    />
    <GraphLegend :columns="legendColumns" />
  </div>
</template>
