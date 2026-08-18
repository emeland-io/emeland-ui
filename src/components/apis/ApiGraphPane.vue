<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApiStore } from '@/stores/apis'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { buildApiGraph } from '@/graph/apiGraph'
import { resolveApiContextFlows } from '@/utils/apiContexts'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import GraphLegend, { type LegendItem } from '@/components/graph/GraphLegend.vue'
import {
  API_PILL,
  COMPONENT_PENTAGON,
  INSTANCE_PENTAGON,
  UNMAPPED_RECT,
} from '@/components/graph/legendSwatches'
import type { Api, ApiInstance } from '@/types/api'

const props = withDefaults(
  defineProps<{
    apis: Api[]
    selectedId: string
    showComponents?: boolean
    showInstances?: boolean
    showUnmapped?: boolean
    showControls?: boolean
    matchIds?: Set<string>
    cursorId?: string
    suspendCursorFollow?: boolean
  }>(),
  {
    showComponents: true,
    showInstances: false,
    showUnmapped: true,
    showControls: true,
    matchIds: () => new Set<string>(),
    cursorId: '',
    suspendCursorFollow: false,
  },
)

const emit = defineEmits<{
  select: [id: string]
  'open-component': [id: string]
  'open-instance': [id: string]
}>()

const apiStore = useApiStore()
const componentStore = useComponentStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()

const { contextForInstance } = useInstanceContext()

function instanceContext(inst: ApiInstance): string | undefined {
  const resolved = contextForInstance(inst)
  return resolved.name ?? (resolved.unresolved ? resolved.id : undefined)
}

const contextFlows = computed(() =>
  resolveApiContextFlows({
    apis: props.apis,
    components: componentStore.components,
    componentInstances: componentStore.componentInstances,
    systemInstances: systemStore.systemInstances,
  }),
)

const anyCrosses = computed(() => [...contextFlows.value.values()].some((f) => f.crosses))

const graphModel = computed(() =>
  buildApiGraph({
    apis: props.apis,
    components: componentStore.components,
    systemName: (id) => systemStore.systemMap.get(id)?.displayName,
    findingCountOf: findingsStore.findingCountFor,
    findingKindsOf: findingsStore.findingKindsFor,
    crossesOf: (id) => contextFlows.value.get(id)?.crosses ?? false,
    crossCountOf: (id) => contextFlows.value.get(id)?.crossContexts.length ?? 0,
    instancesOf: (id) => apiStore.getInstancesForApi(id),
    instanceUnresolved: (inst) => contextForInstance(inst).unresolved,
    unmappedInstances: props.showUnmapped ? apiStore.unmappedInstances : [],
    instanceContext,
    systemInstanceName: (id) => systemStore.systemInstanceMap.get(id)?.displayName,
    showComponents: props.showComponents,
    showInstances: props.showInstances,
  }),
)

const legendColumns = computed<LegendItem[][]>(() => {
  const nodes: LegendItem[] = [{ swatch: API_PILL, label: 'api' }]
  if (props.showComponents) nodes.push({ swatch: COMPONENT_PENTAGON, label: 'component' })
  if (props.showInstances) nodes.push({ swatch: INSTANCE_PENTAGON, label: 'instance' })
  if (props.showInstances && props.showUnmapped && apiStore.unmappedInstances.length > 0)
    nodes.push({ swatch: UNMAPPED_RECT, label: 'unmapped' })
  if (anyCrosses.value) nodes.push({ swatch: { shape: 'crossing' }, label: 'crosses boundary' })

  const edges: LegendItem[] = props.showComponents
    ? [
        { swatch: { shape: 'arrow' }, label: 'provides' },
        { swatch: { shape: 'arrow', dashed: true }, label: 'consumes' },
        { swatch: { shape: 'chip', type: 'System' }, label: 'system' },
      ]
    : [{ swatch: { shape: 'arrow' }, label: 'via component' }]

  return [nodes, edges]
})

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'api') emit('select', id.slice('api:'.length))
  else if (kind === 'component') emit('open-component', id.slice('comp:'.length))
  else if (kind === 'instance') emit('open-instance', id.slice('inst:'.length))
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
      :selected-id="`api:${selectedId}`"
      :cursor-id="cursorId ? `inst:${cursorId}` : ''"
      :suspend-cursor-follow="suspendCursorFollow"
      class="min-h-0 flex-1"
      @node-click="onNodeClick"
    />
    <GraphLegend :columns="legendColumns" />
  </div>
</template>
