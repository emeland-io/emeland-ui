<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { buildOfferingGraph } from '@/graph/offeringGraph'
import { prefixedId, stripPrefix } from '@/graph/ids'
import type { GraphNodeClick } from '@/types/graph'
import GraphPaneShell from '@/components/graph/GraphPaneShell.vue'
import { type LegendItem } from '@/components/graph/GraphLegend.vue'
import {
  CAPABILITY_PILL,
  ORDER_SHEET_OPEN,
  ORDER_SHEET_PARTIAL,
  ORDER_SHEET_FULFILLED,
  INSTANCE_PENTAGON,
} from '@/components/graph/legendSwatches'
import type { Capability } from '@/types/capability'
import type { Order } from '@/types/order'

const props = withDefaults(
  defineProps<{
    capabilities: Capability[]
    orders: Order[]
    selectedCapabilityId?: string
    selectedOrderId?: string
    showFulfillment?: boolean
    showControls?: boolean
    matchIds?: Set<string>
  }>(),
  {
    selectedCapabilityId: '',
    selectedOrderId: '',
    showFulfillment: true,
    showControls: true,
    matchIds: () => new Set<string>(),
  },
)

const emit = defineEmits<{
  'select-capability': [id: string]
  'select-order': [id: string]
  'open-system': [id: string]
}>()

const systemStore = useSystemStore()
const findingsStore = useFindingsStore()

const graphModel = computed(() =>
  buildOfferingGraph({
    capabilities: props.capabilities,
    orders: props.orders,
    findingCountOf: findingsStore.findingCountFor,
    findingKindsOf: findingsStore.findingKindsFor,
    systemInstanceOf: (id) => systemStore.systemInstanceMap.get(id),
    systemName: (id) => systemStore.systemMap.get(id)?.displayName,
    showFulfillment: props.showFulfillment,
  }),
)

const selectedId = computed(() =>
  props.selectedCapabilityId
    ? prefixedId('capability', props.selectedCapabilityId)
    : props.selectedOrderId
      ? prefixedId('order', props.selectedOrderId)
      : '',
)

const legendColumns = computed<LegendItem[][]>(() => {
  const nodes: LegendItem[] = [
    { swatch: CAPABILITY_PILL, label: 'capability' },
    { swatch: ORDER_SHEET_OPEN, label: 'order open' },
    { swatch: ORDER_SHEET_PARTIAL, label: 'order partial' },
    { swatch: ORDER_SHEET_FULFILLED, label: 'order fulfilled' },
  ]
  if (props.showFulfillment) nodes.push({ swatch: INSTANCE_PENTAGON, label: 'instance' })

  const edges: LegendItem[] = [{ swatch: { shape: 'arrow', dashed: true }, label: 'ordered in' }]
  if (props.showFulfillment) edges.push({ swatch: { shape: 'arrow' }, label: 'fulfilled by' })

  return [nodes, edges]
})

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'capability') {
    emit('select-capability', stripPrefix('capability', id))
  } else if (kind === 'order') {
    emit('select-order', stripPrefix('order', id))
  } else if (kind === 'instance') {
    const inst = systemStore.systemInstanceMap.get(stripPrefix('instance', id))
    if (inst?.system && systemStore.systemMap.has(inst.system)) emit('open-system', inst.system)
  }
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
