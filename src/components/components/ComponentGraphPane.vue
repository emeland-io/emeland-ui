<script setup lang="ts">
import { computed } from 'vue'
import { useApiStore } from '@/stores/apis'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { buildComponentGraph } from '@/graph/componentGraph'
import type { GraphNodeClick } from '@/types/graph'
import GraphPaneShell from '@/components/graph/GraphPaneShell.vue'
import { type LegendItem } from '@/components/graph/GraphLegend.vue'
import {
  API_PILL,
  COMPONENT_PENTAGON,
  INSTANCE_PENTAGON,
  UNMAPPED_RECT,
} from '@/components/graph/legendSwatches'
import type { Component } from '@/types/component'

const props = withDefaults(
  defineProps<{
    components: Component[]
    selectedId: string
    showInstances?: boolean
    showUnmapped?: boolean
    showApis?: boolean
    showControls?: boolean
    matchIds?: Set<string>
    cursorId?: string
    suspendCursorFollow?: boolean
  }>(),
  {
    showInstances: false,
    showUnmapped: true,
    showApis: true,
    showControls: true,
    matchIds: () => new Set<string>(),
    cursorId: '',
    suspendCursorFollow: false,
  },
)

const emit = defineEmits<{
  select: [id: string]
  'open-instance': [id: string]
  'open-api': [id: string]
}>()

const store = useComponentStore()
const apiStore = useApiStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()
const { contextForInstance } = useInstanceContext()

const graphModel = computed(() =>
  buildComponentGraph({
    components: props.components,
    apiName: (id) => apiStore.getApiName(id),
    apiVersion: (id) => apiStore.apiMap.get(id)?.version?.version || undefined,
    apiDescription: (id) => apiStore.apiMap.get(id)?.description || undefined,
    systemName: (id) => systemStore.systemMap.get(id)?.displayName,
    findingCountOf: findingsStore.findingCountFor,
    findingKindsOf: findingsStore.findingKindsFor,
    instancesOf: (id) => store.getInstancesForComponent(id),
    instanceContext: (inst) => contextForInstance(inst).name,
    instanceUnresolved: (inst) => contextForInstance(inst).unresolved,
    systemInstanceName: (id) => systemStore.systemInstanceMap.get(id)?.displayName,
    unmappedInstances: props.showUnmapped ? store.unmappedInstances : [],
    showInstances: props.showInstances,
    showApis: props.showApis,
  }),
)

const legendColumns = computed<LegendItem[][]>(() => {
  const nodes: LegendItem[] = [{ swatch: COMPONENT_PENTAGON, label: 'component' }]
  if (props.showInstances) nodes.push({ swatch: INSTANCE_PENTAGON, label: 'instance' })
  if (props.showInstances && props.showUnmapped && store.unmappedInstances.length > 0)
    nodes.push({ swatch: UNMAPPED_RECT, label: 'unmapped' })
  if (props.showApis) nodes.push({ swatch: API_PILL, label: 'api' })

  const edges: LegendItem[] = [
    { swatch: { shape: 'arrow' }, label: props.showApis ? 'provides' : 'depends on' },
  ]
  if (props.showApis) edges.push({ swatch: { shape: 'arrow', dashed: true }, label: 'consumes' })
  edges.push({ swatch: { shape: 'chip', type: 'System' }, label: 'system' })
  if (props.showInstances)
    edges.push({ swatch: { shape: 'chip', type: 'Context' }, label: 'context' })

  return [nodes, edges]
})

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'component') emit('select', id.slice('comp:'.length))
  else if (kind === 'instance') emit('open-instance', id.slice('inst:'.length))
  else if (kind === 'api') emit('open-api', id.slice('api:'.length))
}
</script>

<template>
  <GraphPaneShell
    :show-controls="showControls"
    :match-ids="matchIds"
    :nodes="graphModel.nodes"
    :edges="graphModel.edges"
    :selected-id="`comp:${selectedId}`"
    :cursor-id="cursorId ? `inst:${cursorId}` : ''"
    :suspend-cursor-follow="suspendCursorFollow"
    :legend-columns="legendColumns"
    @node-click="onNodeClick"
  />
</template>
