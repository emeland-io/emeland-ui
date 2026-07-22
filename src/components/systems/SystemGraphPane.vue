<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { buildInstanceGraph } from '@/graph/instanceGraph'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import type { System } from '@/types/system'

const props = defineProps<{
  systems: System[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  openInstance: [id: string]
}>()

const store = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

function contextName(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  return contextStore.contextMap.get(contextId)?.displayName
}

const graphModel = computed(() =>
  buildInstanceGraph({
    systems: props.systems,
    instancesOf: store.getInstancesForSystem,
    contextName,
    findingCountOf: findingsStore.findingCountFor,
  }),
)

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'system') emit('select', id)
  else if (kind === 'instance') emit('openInstance', id)
}
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col">
    <FlowGraph
      :nodes="graphModel.nodes"
      :edges="graphModel.edges"
      :selected-id="selectedId"
      class="min-h-0 flex-1"
      @node-click="onNodeClick"
    />
  </div>
</template>