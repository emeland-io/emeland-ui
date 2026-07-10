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
  <div class="relative flex min-h-0 flex-1 flex-col">
    <FlowGraph
      :nodes="graphModel.nodes"
      :edges="graphModel.edges"
      :selected-id="`comp:${selectedId}`"
      class="min-h-0 flex-1"
      @node-click="onNodeClick"
    />
    <!-- legend -->
    <div
      class="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 rounded border border-border-1 bg-bg-1/90 px-3 py-2"
    >
      <div class="flex items-center gap-2">
        <svg
          width="30"
          height="10"
          viewBox="0 0 30 10"
          class="shrink-0"
        >
          <line
            x1="0"
            y1="5"
            x2="22"
            y2="5"
            stroke="var(--color-text-3)"
            stroke-width="1.5"
          />
          <path
            d="M22 1.5 L29 5 L22 8.5 Z"
            fill="var(--color-text-3)"
          />
        </svg>
        <span class="font-mono text-[11px] text-text-3">provides</span>
      </div>
      <div class="flex items-center gap-2">
        <svg
          width="30"
          height="10"
          viewBox="0 0 30 10"
          class="shrink-0"
        >
          <line
            x1="0"
            y1="5"
            x2="22"
            y2="5"
            stroke="var(--color-text-3)"
            stroke-width="1.5"
            stroke-dasharray="5 4"
          />
          <path
            d="M22 1.5 L29 5 L22 8.5 Z"
            fill="var(--color-text-3)"
          />
        </svg>
        <span class="font-mono text-[11px] text-text-3">consumes</span>
      </div>
    </div>
  </div>
</template>
