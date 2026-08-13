<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { buildContextGraph } from '@/graph/contextGraph'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
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

    <div
      class="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded border border-border-1 bg-bg-1/90 px-2.5 py-2 font-mono text-micro text-text-4 opacity-50 transition-opacity hover:opacity-100"
    >
      <div class="flex items-center gap-1.5">
        <svg
          width="18"
          height="11"
          viewBox="0 0 18 11"
          class="shrink-0"
          aria-hidden="true"
        >
          <polygon
            points="0,0 13,0 18,5 18,11 0,11"
            fill="var(--color-text-4)"
          />
        </svg>
        context
      </div>
      <div class="flex items-center gap-1.5">
        <svg
          width="20"
          height="8"
          viewBox="0 0 20 8"
          class="shrink-0"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="4"
            x2="13"
            y2="4"
            stroke="var(--color-text-3)"
            stroke-width="1.25"
          />
          <path
            d="M13 1.4 L19 4 L13 6.6 Z"
            fill="var(--color-text-3)"
          />
        </svg>
        sub-context
      </div>
    </div>
  </div>
</template>
