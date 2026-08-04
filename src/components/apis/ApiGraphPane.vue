<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconArrowsExchange } from '@tabler/icons-vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { buildApiGraph } from '@/graph/apiGraph'
import { resolveApiContextFlows } from '@/utils/apiContexts'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import type { Api } from '@/types/api'

const props = withDefaults(
  defineProps<{
    apis: Api[]
    selectedId: string
    showComponents?: boolean
    showControls?: boolean
    matchIds?: Set<string>
  }>(),
  {
    showComponents: true,
    showControls: true,
    matchIds: () => new Set<string>(),
  },
)

const emit = defineEmits<{
  select: [id: string]
  'open-component': [id: string]
}>()

const componentStore = useComponentStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()

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
    showComponents: props.showComponents,
  }),
)

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'api') emit('select', id.slice('api:'.length))
  else if (kind === 'component') emit('open-component', id.slice('comp:'.length))
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
      class="min-h-0 flex-1"
      @node-click="onNodeClick"
    />
    <div
      class="absolute right-3 top-3 z-10 flex gap-4 rounded border border-border-1 bg-bg-1/90 px-2.5 py-2 font-mono text-micro text-text-4 opacity-50 transition-opacity hover:opacity-100"
    >
      <!-- node shapes -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1.5">
          <svg
            width="18"
            height="11"
            viewBox="0 0 18 11"
            class="shrink-0"
            aria-hidden="true"
          >
            <rect
              x="0.5"
              y="0.5"
              width="17"
              height="10"
              rx="5"
              fill="var(--color-bg-1)"
              stroke="var(--color-border-2)"
            />
          </svg>
          api
        </div>
        <div
          v-if="showComponents"
          class="flex items-center gap-1.5"
        >
          <svg
            width="18"
            height="11"
            viewBox="0 0 18 11"
            class="shrink-0"
            aria-hidden="true"
          >
            <polygon
              points="0.5,0.5 12.5,0.5 17.5,5 17.5,10.5 0.5,10.5"
              fill="var(--color-bg-2)"
              stroke="var(--color-border-2)"
            />
          </svg>
          component
        </div>
        <div
          v-if="anyCrosses"
          class="flex items-center gap-1.5"
        >
          <IconArrowsExchange
            :size="11"
            :stroke-width="2"
            class="shrink-0 text-text-3"
          />
          crosses boundary
        </div>
      </div>

      <!-- edges and label prefixes -->
      <div class="flex flex-col gap-1">
        <template v-if="showComponents">
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
            provides
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
                stroke-dasharray="3 2.5"
              />
              <path
                d="M13 1.4 L19 4 L13 6.6 Z"
                fill="var(--color-text-3)"
              />
            </svg>
            consumes
          </div>
          <div class="flex items-center gap-1.5">
            <span class="shrink-0 rounded-sm bg-bg-3 px-1 text-text-3">S</span>
            system
          </div>
        </template>
        <div
          v-else
          class="flex items-center gap-1.5"
        >
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
          via component
        </div>
      </div>
    </div>
  </div>
</template>
