<script setup lang="ts">
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { useSystemRefGroups } from '@/composables/useUnmappedGroups'
import MappingTag from '@/components/MappingTag.vue'
import UnmappedSection from '@/components/UnmappedSection.vue'
import ResourceTreeRow from '@/components/list/ResourceTreeRow.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'
import ChildCountBars from '@/components/list/ChildCountBars.vue'
import { mappingStateOf } from '@/utils/mapping'
import type { HierarchyRow } from '@/composables/useHierarchyRows'
import type { System, SystemInstance } from '@/types/system'

export type SystemRow = HierarchyRow<System>

const props = withDefaults(
  defineProps<{
    rows: SystemRow[]
    selectedId: string
    collapsed: Set<string>
    activeRail: string
    /** instances without a resolvable parent system, shown in their own section */
    unmapped?: SystemInstance[]
    /** keep the unmapped section expanded (e.g. while a search is active) */
    forceExpanded?: boolean
    /** fold the main rows away (e.g. to focus on the unmapped section) */
    listCollapsed?: boolean
    /** instance currently shown in the drawer, marked with an accent indicator */
    activeInstanceId?: string
  }>(),
  { unmapped: () => [], forceExpanded: false, listCollapsed: false, activeInstanceId: '' },
)

const emit = defineEmits<{
  select: [id: string]
  'toggle-collapse': [id: string]
  'open-instance': [id: string]
}>()

const store = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

// group the section by system reference
const { unmappedGroups, unmappedGroupTitle } = useSystemRefGroups(
  () => props.unmapped,
  (i) => i.system,
  (i) => i.systemInstanceId,
)

function instanceCount(id: string): number {
  return store.getInstancesForSystem(id).length
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function instanceContext(inst: SystemInstance): string | undefined {
  if (!inst.context) return undefined
  return contextStore.contextMap.get(inst.context)?.displayName ?? inst.context
}

function mappingState(inst: SystemInstance) {
  return mappingStateOf(inst.system, store.systemMap.has(inst.system))
}
</script>

<template>
  <template v-if="!listCollapsed">
    <ResourceTreeRow
      v-for="row in rows"
      :id="row.item.systemId"
      :key="row.item.systemId"
      :title="row.item.displayName"
      :depth="row.depth"
      :ancestors="row.ancestors"
      :child-count="row.childCount"
      :selected="row.item.systemId === selectedId"
      :collapsed="collapsed.has(row.item.systemId)"
      :active-rail="activeRail"
      @select="emit('select', $event)"
      @toggle-collapse="emit('toggle-collapse', $event)"
    >
      <span
        class="rounded px-1.5 py-0.5 font-mono text-meta"
        :class="row.item.abstract ? 'bg-bg-2 text-text-3' : 'bg-accent/10 text-accent-text'"
      >
        {{ store.getKindForSystem(row.item) }}
      </span>
      <span
        v-if="row.item.version?.version"
        class="font-mono text-meta text-text-4"
      >
        v{{ row.item.version.version }}
      </span>
      <template #badges>
        <ChildCountBars
          :count="row.childCount"
          :title="`${row.childCount} sub-system(s)`"
        />
        <FindingsBadge :count="findingCount(row.item.systemId)" />
        <InstanceCountBadge
          v-if="store.instancesLoaded"
          :count="instanceCount(row.item.systemId)"
          :title="`${instanceCount(row.item.systemId)} instance(s)`"
        />
      </template>
    </ResourceTreeRow>
  </template>

  <!-- instances without a resolvable parent system -->
  <UnmappedSection
    :groups="unmappedGroups"
    :id-of="(i) => i.systemInstanceId"
    :group-key-of="(i) => i.system || ''"
    :group-title="unmappedGroupTitle"
    :force-expanded="forceExpanded"
    :active-instance-id="activeInstanceId"
    row-hover="hover:bg-bg-2"
    @open="(id) => emit('open-instance', id)"
  >
    <template #meta="{ inst }">
      <MappingTag :state="mappingState(inst)" />
      <span
        v-if="instanceContext(inst)"
        class="truncate font-mono text-meta text-text-4"
      >
        {{ instanceContext(inst) }}
      </span>
    </template>
  </UnmappedSection>
</template>
