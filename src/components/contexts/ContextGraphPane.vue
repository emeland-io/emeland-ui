<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { buildContextGraph } from '@/graph/contextGraph'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import GraphLegend, { type LegendItem } from '@/components/graph/GraphLegend.vue'
import type { Context } from '@/types/context'

const props = withDefaults(
  defineProps<{
    contexts: Context[]
    selectedId: string
    showControls?: boolean
    matchIds?: Set<string>
  }>(),
  { showControls: true, matchIds: () => new Set<string>() },
)

const emit = defineEmits<{
  select: [id: string]
}>()

const store = useContextStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()

const graphModel = computed(() =>
  buildContextGraph({
    contexts: props.contexts,
    typeName: (c: Context) => {
      const name = store.getTypeName(c)
      return name === 'Unknown' ? '' : name
    },
    instanceCountOf: (id: string) =>
      systemStore.systemInstances.filter((i) => i.context === id).length,
    findingCountOf: findingsStore.findingCountFor,
    findingKindsOf: findingsStore.findingKindsFor,
    instancesIn: (id: string) => systemStore.systemInstances.filter((i) => i.context === id),
    instanceUnresolved: (inst) => !inst.system || !systemStore.systemMap.has(inst.system),
  }),
)

const legendColumns: LegendItem[][] = [
  [
    { swatch: { shape: 'pentagon', fill: 'var(--color-text-4)' }, label: 'context' },
    { swatch: { shape: 'arrow' }, label: 'sub-context' },
  ],
]

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'context-node') emit('select', id)
}

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
      :nodes="graphModel.nodes"
      :edges="graphModel.edges"
      :selected-id="selectedId"
      class="min-h-0 flex-1"
      @node-click="onNodeClick"
    />
    <GraphLegend :columns="legendColumns" />
  </div>
</template>
