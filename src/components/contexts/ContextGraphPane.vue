<script setup lang="ts">
import { computed } from 'vue'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { buildContextGraph } from '@/graph/contextGraph'
import type { GraphNodeClick } from '@/types/graph'
import GraphPaneShell from '@/components/graph/GraphPaneShell.vue'
import { type LegendItem } from '@/components/graph/GraphLegend.vue'
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
</script>

<template>
  <GraphPaneShell
    :show-controls="showControls"
    :match-ids="matchIds"
    :nodes="graphModel.nodes"
    :edges="graphModel.edges"
    :selected-id="selectedId"
    :legend-columns="legendColumns"
    @node-click="onNodeClick"
  />
</template>
