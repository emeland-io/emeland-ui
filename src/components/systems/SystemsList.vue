<script setup lang="ts">
import { computed } from 'vue'
import { IconChevronRight, IconAlertTriangle } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import MappingTag from '@/components/MappingTag.vue'
import UnmappedSection from '@/components/UnmappedSection.vue'
import { mappingStateOf, groupByBrokenRef } from '@/utils/mapping'
import type { System, SystemInstance } from '@/types/system'

export interface SystemRow {
  system: System
  depth: number
  childCount: number
  ancestors: string[]
}

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
const unmappedGroups = computed(() =>
  groupByBrokenRef(props.unmapped, (i) => i.system, 'No system reference'),
)

function groupTitle(key: string): string {
  return key ? `References missing system ${key}` : 'No system reference'
}

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
    <div
      v-for="row in rows"
      :key="row.system.systemId"
      :data-row-id="row.system.systemId"
      class="relative cursor-pointer border-b border-l-2 border-border-1 py-3 pr-4 transition-colors"
      :class="[
        row.system.systemId === selectedId
          ? 'border-l-accent bg-accent/5'
          : 'border-l-transparent hover:bg-bg-2',
        row.childCount > 0 && row.system.systemId !== selectedId ? 'bg-bg-1' : '',
      ]"
      :style="{ paddingLeft: `${16 + row.depth * 26}px` }"
      @click="emit('select', row.system.systemId)"
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
          :title="row.system.displayName"
        >
          {{ row.system.displayName }}
        </span>
        <button
          v-if="row.childCount > 0"
          class="-mr-1 shrink-0 rounded p-0.5 text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
          :title="collapsed.has(row.system.systemId) ? 'Expand' : 'Collapse'"
          @click.stop="emit('toggle-collapse', row.system.systemId)"
        >
          <IconChevronRight
            :size="14"
            :stroke-width="2"
            class="transition-transform"
            :class="collapsed.has(row.system.systemId) ? '' : 'rotate-90'"
          />
        </button>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          class="rounded px-1.5 py-0.5 font-mono text-meta"
          :class="row.system.abstract ? 'bg-bg-2 text-text-3' : 'bg-accent/10 text-accent-text'"
        >
          {{ store.getKindForSystem(row.system) }}
        </span>
        <span
          v-if="row.system.version?.version"
          class="font-mono text-meta text-text-4"
        >
          v{{ row.system.version.version }}
        </span>
        <span class="ml-auto flex shrink-0 items-center gap-1.5">
          <span
            v-if="row.childCount > 0"
            class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
            :title="`${row.childCount} sub-system(s)`"
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
            v-if="findingCount(row.system.systemId) > 0"
            class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
            :title="`${findingCount(row.system.systemId)} finding(s)`"
          >
            <IconAlertTriangle
              :size="10"
              :stroke-width="2"
            />
            {{ findingCount(row.system.systemId) }}
          </span>
          <span
            v-if="store.instancesLoaded && instanceCount(row.system.systemId) > 0"
            class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
            :title="`${instanceCount(row.system.systemId)} instance(s)`"
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
            {{ instanceCount(row.system.systemId) }}
          </span>
        </span>
      </div>
    </div>
  </template>

  <!-- instances without a resolvable parent system -->
  <UnmappedSection
    :groups="unmappedGroups"
    :id-of="(i) => i.systemInstanceId"
    :group-key-of="(i) => i.system || ''"
    :group-title="groupTitle"
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
