<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApiStore } from '@/stores/apis'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { buildComponentGraph } from '@/graph/componentGraph'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
import TypeChip from '@/components/TypeChip.vue'
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

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'component') emit('select', id.slice('comp:'.length))
  else if (kind === 'instance') emit('open-instance', id.slice('inst:'.length))
  else if (kind === 'api') emit('open-api', id.slice('api:'.length))
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
      :selected-id="`comp:${selectedId}`"
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
          v-if="showInstances && showUnmapped && store.unmappedInstances.length > 0"
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
          v-if="showApis"
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
              rx="5"
              fill="var(--color-bg-1)"
              stroke="var(--color-border-2)"
            />
          </svg>
          api
        </div>
      </div>

      <!-- edges and label prefixes -->
      <div class="flex flex-col gap-1">
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
          {{ showApis ? 'provides' : 'depends on' }}
        </div>
        <div
          v-if="showApis"
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
        <div
          v-if="showInstances"
          class="flex items-center gap-1.5"
        >
          <TypeChip type="Context" />
          context
        </div>
      </div>
    </div>
  </div>
</template>
