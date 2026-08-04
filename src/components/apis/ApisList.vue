<script setup lang="ts">
import { IconAlertTriangle, IconArrowsExchange } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import type { Api } from '@/types/api'

withDefaults(
  defineProps<{
    apis: Api[]
    selectedId: string
    /** apiId -> number of boundary crossings (contexts consumed in but not provided in) */
    crossings?: Map<string, number>
  }>(),
  { crossings: () => new Map<string, number>() },
)

const emit = defineEmits<{
  select: [id: string]
}>()

const store = useApiStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()

function systemName(id: string): string | undefined {
  return systemStore.systemMap.get(id)?.displayName
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function instanceCount(id: string): number {
  return store.getInstancesForApi(id).length
}
</script>

<template>
  <div
    v-for="api in apis"
    :key="api.apiId"
    class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
    :class="[
      api.apiId === selectedId
        ? 'border-l-accent bg-accent/5'
        : 'border-l-transparent hover:bg-bg-1',
    ]"
    @click="emit('select', api.apiId)"
  >
    <div
      class="truncate text-body font-medium text-text-1"
      :title="api.displayName"
    >
      {{ api.displayName }}
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <span
        class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta"
        :class="api.type === 'Unknown' ? 'text-text-4' : 'text-text-3'"
      >
        {{ api.type }}
      </span>
      <span
        v-if="systemName(api.system)"
        class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta text-text-3"
      >
        {{ systemName(api.system) }}
      </span>
      <span
        v-if="api.version?.version"
        class="font-mono text-meta text-text-4"
      >
        v{{ api.version.version }}
      </span>
      <span class="ml-auto flex shrink-0 items-center gap-1.5">
        <span
          v-if="crossings.has(api.apiId)"
          class="flex shrink-0 items-center gap-1 rounded-full border border-border-2 bg-bg-2 px-1.5 py-0.5 font-mono text-micro tabular-nums text-text-3"
          title="Crosses a context boundary"
        >
          <IconArrowsExchange
            :size="10"
            :stroke-width="2"
          />
          {{ crossings.get(api.apiId) }}
        </span>
        <span
          v-if="findingCount(api.apiId) > 0"
          class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
          :title="`${findingCount(api.apiId)} finding(s)`"
        >
          <IconAlertTriangle
            :size="10"
            :stroke-width="2"
          />
          {{ findingCount(api.apiId) }}
        </span>
        <span
          v-if="store.instancesLoaded && instanceCount(api.apiId) > 0"
          class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
          :title="`${instanceCount(api.apiId)} instance(s)`"
        >
          <svg
            width="14"
            height="9"
            viewBox="0 0 14 9"
            class="shrink-0"
            aria-hidden="true"
          >
            <polygon
              points="0,0 10,0 14,4 14,9 0,9"
              fill="var(--color-text-3)"
            />
          </svg>
          {{ instanceCount(api.apiId) }}
        </span>
      </span>
    </div>
  </div>
</template>
