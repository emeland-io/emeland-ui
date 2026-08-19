<script setup lang="ts">
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import { useFindingsStore } from '@/stores/findings'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { useSystemInstanceGroups } from '@/composables/useUnmappedGroups'
import MappingTag from '@/components/MappingTag.vue'
import UnmappedSection from '@/components/UnmappedSection.vue'
import ResourceListRow from '@/components/list/ResourceListRow.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'
import { mappingStateOf } from '@/utils/mapping'
import type { Component, ComponentInstance } from '@/types/component'

const props = withDefaults(
  defineProps<{
    components: Component[]
    selectedId: string
    /** instances without a resolvable parent component, shown in their own section */
    unmapped?: ComponentInstance[]
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
  'open-instance': [id: string]
}>()

const systemStore = useSystemStore()
const store = useComponentStore()
const findingsStore = useFindingsStore()
const { contextForInstance } = useInstanceContext()

// group the section by the system instance each unmapped instance references
const { unmappedGroups, unmappedGroupTitle } = useSystemInstanceGroups(
  () => props.unmapped,
  (i) => i.systemInstance,
  (i) => i.componentInstanceId,
)

function systemName(id: string): string | undefined {
  return systemStore.systemMap.get(id)?.displayName
}

function instanceCount(id: string): number {
  return store.getInstancesForComponent(id).length
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function systemInstanceName(id: string | undefined): string | undefined {
  if (!id) return undefined
  return systemStore.systemInstanceMap.get(id)?.displayName
}

function instanceContext(inst: ComponentInstance): string | undefined {
  return contextForInstance(inst).name
}

function mappingState(inst: ComponentInstance) {
  return mappingStateOf(inst.component, store.componentMap.has(inst.component ?? ''))
}
</script>

<template>
  <template v-if="!listCollapsed">
    <ResourceListRow
      v-for="comp in components"
      :id="comp.componentId"
      :key="comp.componentId"
      :title="comp.displayName"
      :selected="comp.componentId === selectedId"
      @select="emit('select', $event)"
    >
      <span
        v-if="systemName(comp.system)"
        class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta text-text-3"
      >
        {{ systemName(comp.system) }}
      </span>
      <span
        v-if="comp.version?.version"
        class="font-mono text-meta text-text-4"
      >
        v{{ comp.version.version }}
      </span>
      <template #badges>
        <FindingsBadge :count="findingCount(comp.componentId)" />
        <InstanceCountBadge
          v-if="store.instancesLoaded"
          :count="instanceCount(comp.componentId)"
          :title="`${instanceCount(comp.componentId)} instance(s)`"
        />
      </template>
    </ResourceListRow>
  </template>

  <!-- instances without a resolvable parent component -->
  <UnmappedSection
    :groups="unmappedGroups"
    :id-of="(i) => i.componentInstanceId"
    :group-key-of="(i) => i.systemInstance || ''"
    :group-title="unmappedGroupTitle"
    :force-expanded="forceExpanded"
    :active-instance-id="activeInstanceId"
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
      <span
        v-else-if="systemInstanceName(inst.systemInstance)"
        class="truncate font-mono text-meta text-text-4"
        :title="systemInstanceName(inst.systemInstance)"
      >
        {{ systemInstanceName(inst.systemInstance) }}
      </span>
    </template>
  </UnmappedSection>
</template>
