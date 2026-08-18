<script setup lang="ts">
import { computed } from 'vue'
import { IconAlertTriangle } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import { useFindingsStore } from '@/stores/findings'
import { useInstanceContext } from '@/composables/useInstanceContext'
import MappingTag from '@/components/MappingTag.vue'
import UnmappedSection from '@/components/UnmappedSection.vue'
import { mappingStateOf, groupByBrokenRef } from '@/utils/mapping'
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

// group the section by the system instance each unmapped
const unmappedGroups = computed(() =>
  groupByBrokenRef(
    props.unmapped,
    (i) => i.systemInstance,
    'No system instance',
    (key) => systemStore.systemInstanceMap.get(key)?.displayName,
    (key) => systemStore.systemInstanceMap.has(key),
  ),
)

function groupTitle(key: string): string {
  if (!key) return 'No system instance'
  return systemStore.systemInstanceMap.has(key) ? key : `References missing system instance ${key}`
}

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
    <div
      v-for="comp in components"
      :key="comp.componentId"
      :data-row-id="comp.componentId"
      class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
      :class="[
        comp.componentId === selectedId
          ? 'border-l-accent bg-accent/5'
          : 'border-l-transparent hover:bg-bg-1',
      ]"
      @click="emit('select', comp.componentId)"
    >
      <div
        class="truncate text-body font-medium text-text-1"
        :title="comp.displayName"
      >
        {{ comp.displayName }}
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
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
        <span class="ml-auto flex shrink-0 items-center gap-1.5">
          <span
            v-if="findingCount(comp.componentId) > 0"
            class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
            :title="`${findingCount(comp.componentId)} finding(s)`"
          >
            <IconAlertTriangle
              :size="10"
              :stroke-width="2"
            />
            {{ findingCount(comp.componentId) }}
          </span>
          <span
            v-if="store.instancesLoaded && instanceCount(comp.componentId) > 0"
            class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
            :title="`${instanceCount(comp.componentId)} instance(s)`"
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
            {{ instanceCount(comp.componentId) }}
          </span>
        </span>
      </div>
    </div>
  </template>

  <!-- instances without a resolvable parent component -->
  <UnmappedSection
    :groups="unmappedGroups"
    :id-of="(i) => i.componentInstanceId"
    :group-key-of="(i) => i.systemInstance || ''"
    :group-title="groupTitle"
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
