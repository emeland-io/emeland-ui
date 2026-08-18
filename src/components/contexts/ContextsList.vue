<script setup lang="ts">
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import ResourceTreeRow from '@/components/list/ResourceTreeRow.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'
import ChildCountBars from '@/components/list/ChildCountBars.vue'
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
  <ResourceTreeRow
    v-for="row in rows"
    :id="row.context.contextId"
    :key="row.context.contextId"
    :title="row.context.displayName"
    :depth="row.depth"
    :ancestors="row.ancestors"
    :child-count="row.childCount"
    :selected="row.context.contextId === selectedId"
    :collapsed="collapsed.has(row.context.contextId)"
    :active-rail="activeRail"
    @select="emit('select', $event)"
    @toggle-collapse="emit('toggle-collapse', $event)"
  >
    <span
      v-if="typeName(row.context)"
      class="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-meta text-accent-text"
    >
      {{ typeName(row.context) }}
    </span>
    <template #badges>
      <ChildCountBars
        :count="row.childCount"
        :title="`${row.childCount} sub-context(s)`"
      />
      <FindingsBadge :count="findingCount(row.context.contextId)" />
      <InstanceCountBadge
        :count="instanceCount(row.context.contextId)"
        :title="`${instanceCount(row.context.contextId)} system instance(s)`"
      />
    </template>
  </ResourceTreeRow>
</template>
