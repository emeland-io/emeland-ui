<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconArrowsExchange } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { buildApiGraph } from '@/graph/apiGraph'
import { resolveApiContextFlows } from '@/utils/apiContexts'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import TypeChip from '@/components/TypeChip.vue'
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
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

function instanceContext(inst: ApiInstance): string | undefined {
  const ctxId = inst.systemInstance
    ? systemStore.systemInstanceMap.get(inst.systemInstance)?.context
    : undefined
  return ctxId ? (contextStore.contextMap.get(ctxId)?.displayName ?? ctxId) : undefined
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
    unmappedInstances: props.showUnmapped ? apiStore.unmappedInstances : [],
    instanceContext,
    systemInstanceName: (id) => systemStore.systemInstanceMap.get(id)?.displayName,
    showComponents: props.showComponents,
    showInstances: props.showInstances,
  }),
)

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
          v-if="showInstances"
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
              points="0,0 13,0 18,5 18,11 0,11"
              fill="var(--color-bg-3)"
            />
          </svg>
          instance
        </div>
        <div
          v-if="showInstances && showUnmapped && apiStore.unmappedInstances.length > 0"
          class="flex items-center gap-1.5"
        >
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
              rx="2"
              fill="none"
              stroke="var(--color-text-3)"
              stroke-dasharray="2.5 2"
            />
          </svg>
          unmapped
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
            <TypeChip type="System" />
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
