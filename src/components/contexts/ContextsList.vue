<script setup lang="ts">
import { IconChevronRight, IconAlertTriangle } from '@tabler/icons-vue'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import type { Context } from '@/types/context'

export interface ContextRow {
  context: Context
  depth: number
  childCount: number
  ancestors: string[]
}

defineProps<{
  rows: ContextRow[]
  selectedId: string
  collapsed: Set<string>
  activeRail: string
}>()

const emit = defineEmits<{
  select: [id: string]
  'toggle-collapse': [id: string]
}>()

const store = useContextStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()

/** System instances that live in this context. */
function instanceCount(id: string): number {
  return systemStore.systemInstances.filter((i) => i.context === id).length
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function typeName(context: Context): string | undefined {
  const name = store.getTypeName(context)
  return name === 'Unknown' ? undefined : name
}
</script>

<template>
  <div
    v-for="row in rows"
    :key="row.context.contextId"
    :data-row-id="row.context.contextId"
    class="relative cursor-pointer border-b border-l-2 border-border-1 py-3 pr-4 transition-colors"
    :class="[
      row.context.contextId === selectedId
        ? 'border-l-accent bg-accent/5'
        : 'border-l-transparent hover:bg-bg-2',
      row.childCount > 0 && row.context.contextId !== selectedId ? 'bg-bg-1' : '',
    ]"
    :style="{ paddingLeft: `${16 + row.depth * 26}px` }"
    @click="emit('select', row.context.contextId)"
  >
    <span
      v-for="level in row.depth"
      :key="level"
      class="pointer-events-none absolute inset-y-0 w-px transition-colors"
      :class="
        activeRail && row.ancestors[level - 1] === activeRail ? 'bg-border-2' : 'bg-border-1/50'
      "
      :style="{ left: `${16 + (level - 1) * 26 + 7}px` }"
      aria-hidden="true"
    />

    <div class="flex items-center gap-2">
      <span
        class="min-w-0 flex-1 truncate text-body font-medium text-text-1"
        :title="row.context.displayName"
      >
        {{ row.context.displayName }}
      </span>
      <button
        v-if="row.childCount > 0"
        class="-mr-1 shrink-0 rounded p-0.5 text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
        :title="collapsed.has(row.context.contextId) ? 'Expand' : 'Collapse'"
        @click.stop="emit('toggle-collapse', row.context.contextId)"
      >
        <IconChevronRight
          :size="14"
          :stroke-width="2"
          class="transition-transform"
          :class="collapsed.has(row.context.contextId) ? '' : 'rotate-90'"
        />
      </button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <span
        v-if="typeName(row.context)"
        class="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-meta text-accent-text"
      >
        {{ typeName(row.context) }}
      </span>
      <span class="ml-auto flex shrink-0 items-center gap-1.5">
        <span
          v-if="row.childCount > 0"
          class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
          :title="`${row.childCount} sub-context(s)`"
        >
          <svg
            width="13"
            height="10"
            viewBox="0 0 13 10"
            class="shrink-0"
            aria-hidden="true"
          >
            <polygon
              points="0,0 9,0 13,3 13,4 0,4"
              fill="var(--color-text-3)"
            />
            <polygon
              points="0,6 9,6 13,9 13,10 0,10"
              fill="var(--color-text-3)"
              opacity="0.6"
            />
          </svg>
          {{ row.childCount }}
        </span>
        <span
          v-if="findingCount(row.context.contextId) > 0"
          class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
          :title="`${findingCount(row.context.contextId)} finding(s)`"
        >
          <IconAlertTriangle
            :size="10"
            :stroke-width="2"
          />
          {{ findingCount(row.context.contextId) }}
        </span>
        <span
          v-if="instanceCount(row.context.contextId) > 0"
          class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
          :title="`${instanceCount(row.context.contextId)} system instance(s)`"
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
          {{ instanceCount(row.context.contextId) }}
        </span>
      </span>
    </div>
  </div>
</template>
