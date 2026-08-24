<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { buildInstanceGraph } from '@/graph/instanceGraph'
import { buildSystemGraph } from '@/graph/systemGraph'
import type { GraphNodeClick } from '@/types/graph'
import GraphPaneShell from '@/components/graph/GraphPaneShell.vue'
import { type LegendItem } from '@/components/graph/GraphLegend.vue'
import { UNMAPPED_RECT } from '@/components/graph/legendSwatches'
import type { System } from '@/types/system'

const props = withDefaults(
  defineProps<{
    systems: System[]
    selectedId: string
    showControls?: boolean
    matchIds?: Set<string>
    showInstances?: boolean
    showUnmapped?: boolean
    cursorId?: string
    suspendCursorFollow?: boolean
  }>(),
  {
    showControls: true,
    showInstances: true,
    showUnmapped: true,
    matchIds: () => new Set<string>(),
    cursorId: '',
    suspendCursorFollow: false,
  },
)

const emit = defineEmits<{
  select: [id: string]
  'open-instance': [id: string]
}>()

const store = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

function contextName(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  return contextStore.contextMap.get(contextId)?.displayName
}

const graphModel = computed(() =>
  props.showInstances
    ? buildInstanceGraph({
        systems: props.systems,
        instancesOf: store.getInstancesForSystem,
        contextName,
        findingCountOf: findingsStore.findingCountFor,
        findingKindsOf: findingsStore.findingKindsFor,
        unmappedInstances: props.showUnmapped ? store.unmappedInstances : [],
      })
    : buildSystemGraph({
        systems: props.systems,
        findingCountOf: findingsStore.findingCountFor,
        findingKindsOf: findingsStore.findingKindsFor,
        instancesOf: store.getInstancesForSystem,
        instanceUnresolved: (inst) => !!inst.context && !contextStore.contextMap.has(inst.context),
      }),
)

const legendColumns = computed<LegendItem[][]>(() => {
  const nodes: LegendItem[] = [
    { swatch: { shape: 'pentagon', fill: 'var(--color-text-4)' }, label: 'system' },
  ]
  if (props.showInstances) {
    nodes.push({
      swatch: { shape: 'pentagon', fill: 'var(--color-bg-1)', stroke: 'var(--color-text-4)' },
      label: 'instance',
    })
  }
  if (props.showInstances && props.showUnmapped && store.unmappedInstances.length > 0)
    nodes.push({ swatch: UNMAPPED_RECT, label: 'unmapped' })

  const edges: LegendItem[] = props.showInstances
    ? [
        {
          swatch: {
            shape: 'rect',
            fill: 'color-mix(in srgb, var(--color-accent) 4%, transparent)',
            stroke: 'color-mix(in srgb, var(--color-accent) 35%, transparent)',
          },
          label: 'context',
        },
      ]
    : [{ swatch: { shape: 'arrow' }, label: 'sub-system' }]

  return [nodes, edges]
})

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'system') emit('select', id)
  else if (kind === 'instance') emit('open-instance', id)
}
</script>

<template>
  <GraphPaneShell
    :show-controls="showControls"
    :match-ids="matchIds"
    :nodes="graphModel.nodes"
    :edges="graphModel.edges"
    :selected-id="selectedId"
    :cursor-id="cursorId"
    :suspend-cursor-follow="suspendCursorFollow"
    :legend-columns="legendColumns"
    @node-click="onNodeClick"
  />
</template>
