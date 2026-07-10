<script setup lang="ts">
import { computed } from 'vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { buildComponentGraph } from '@/graph/componentGraph'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import type { Component } from '@/types/component'

const props = defineProps<{
  components: Component[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const apiStore = useApiStore()
const systemStore = useSystemStore()

const graphModel = computed(() =>
  buildComponentGraph({
    components: props.components,
    apiName: (id) => apiStore.getApiName(id),
    apiVersion: (id) => apiStore.apiMap.get(id)?.version?.version || undefined,
    systemName: (id) => systemStore.systemMap.get(id)?.displayName,
  }),
)

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'component') emit('select', id.slice('comp:'.length))
}
</script>

<template>
  <FlowGraph
    :nodes="graphModel.nodes"
    :edges="graphModel.edges"
    :selected-id="`comp:${selectedId}`"
    class="min-h-0 flex-1"
    @node-click="onNodeClick"
  />
</template>
