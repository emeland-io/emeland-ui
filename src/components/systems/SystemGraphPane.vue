<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { buildInstanceGraph } from '@/graph/instanceGraph'
import { buildSystemGraph } from '@/graph/systemGraph'
import type { GraphNodeClick } from '@/types/graph'
import FlowGraph from '@/components/graph/FlowGraph.vue'
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
      }),
)

function onNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'system') emit('select', id)
  else if (kind === 'instance') emit('openInstance', id)
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
      :cursor-id="cursorId"
      :suspend-cursor-follow="suspendCursorFollow"
      class="min-h-0 flex-1"
      @node-click="onNodeClick"
    />

    <div
      class="absolute right-3 top-3 z-10 flex gap-4 rounded border border-border-1 bg-bg-1/90 px-2.5 py-2 font-mono text-micro text-text-4 opacity-50 transition-opacity hover:opacity-100"
    >
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
              points="0,0 13,0 18,5 18,11 0,11"
              fill="var(--color-text-4)"
            />
          </svg>
          system
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
              points="0.5,0.5 12.5,0.5 17.5,5 17.5,10.5 0.5,10.5"
              fill="var(--color-bg-1)"
              stroke="var(--color-text-4)"
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
      </div>

      <div class="flex flex-col gap-1">
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
            <rect
              x="0.5"
              y="0.5"
              width="17"
              height="10"
              rx="2"
              fill="color-mix(in srgb, var(--color-accent) 4%, transparent)"
              stroke="color-mix(in srgb, var(--color-accent) 35%, transparent)"
            />
          </svg>
          context
        </div>
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
          sub-system
        </div>
      </div>
    </div>
  </div>
</template>
