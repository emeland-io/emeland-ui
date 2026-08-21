<script setup lang="ts">
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import ResourceTreeRow from '@/components/list/ResourceTreeRow.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'
import ChildCountBars from '@/components/list/ChildCountBars.vue'
import TypeTag from '@/components/TypeTag.vue'
import type { HierarchyRow } from '@/composables/useHierarchyRows'
import type { Context } from '@/types/context'

export type ContextRow = HierarchyRow<Context>

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
    :id="row.item.contextId"
    :key="row.item.contextId"
    :title="row.item.displayName"
    :depth="row.depth"
    :ancestors="row.ancestors"
    :child-count="row.childCount"
    :selected="row.item.contextId === selectedId"
    :collapsed="collapsed.has(row.item.contextId)"
    :active-rail="activeRail"
    @select="emit('select', $event)"
    @toggle-collapse="emit('toggle-collapse', $event)"
  >
    <TypeTag v-if="typeName(row.item)">{{ typeName(row.item) }}</TypeTag>
    <template #badges>
      <ChildCountBars
        :count="row.childCount"
        :title="`${row.childCount} sub-context(s)`"
      />
      <FindingsBadge :count="findingCount(row.item.contextId)" />
      <InstanceCountBadge
        :count="instanceCount(row.item.contextId)"
        :title="`${instanceCount(row.item.contextId)} system instance(s)`"
      />
    </template>
  </ResourceTreeRow>
</template>
