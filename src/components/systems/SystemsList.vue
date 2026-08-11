<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import {
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
  IconAlertTriangle,
  IconLayoutSidebarRight,
} from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import MappingTag from '@/components/MappingTag.vue'
import { mappingStateOf, groupByBrokenRef } from '@/utils/mapping'
import { scrollRowIntoView } from '@/composables/useListKeyboardNav'
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
const unmappedCollapsed = ref(false)
// search forces the section open so matches stay visible; manual state resumes after
const sectionCollapsed = computed(() => unmappedCollapsed.value && !props.forceExpanded)

function toggleUnmapped() {
  unmappedCollapsed.value = !unmappedCollapsed.value
}

// group the section by system reference
const unmappedGroups = computed(() =>
  groupByBrokenRef(props.unmapped, (i) => i.system, 'No system reference'),
)

const collapsedGroups = ref<Set<string>>(new Set())

function groupCollapsed(key: string): boolean {
  return collapsedGroups.value.has(key) && !props.forceExpanded
}

function toggleGroup(key: string) {
  const s = new Set(collapsedGroups.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  collapsedGroups.value = s
}

const allGroupsCollapsed = computed(
  () =>
    unmappedGroups.value.length > 0 &&
    unmappedGroups.value.every((g) => collapsedGroups.value.has(g.key)),
)

function toggleAllGroups() {
  // reveal the section so the effect is visible even when it was collapsed
  unmappedCollapsed.value = false
  collapsedGroups.value = allGroupsCollapsed.value
    ? new Set()
    : new Set(unmappedGroups.value.map((g) => g.key))
}

watch(
  () => props.activeInstanceId,
  async (id) => {
    if (!id) return
    const inst = props.unmapped.find((i) => i.systemInstanceId === id)
    if (!inst) return
    unmappedCollapsed.value = false
    const key = inst.system || ''
    if (collapsedGroups.value.has(key)) {
      const s = new Set(collapsedGroups.value)
      s.delete(key)
      collapsedGroups.value = s
    }
    await nextTick()
    scrollRowIntoView(id)
  },
)

const store = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

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
  <template v-if="unmapped.length > 0">
    <div
      class="flex h-9 shrink-0 cursor-pointer select-none items-center gap-1.5 border-b border-border-1 bg-bg-1 px-2 text-micro font-medium uppercase tracking-wider text-text-4"
      :title="sectionCollapsed ? 'Double-click to expand' : 'Double-click to collapse'"
      @dblclick="toggleUnmapped"
    >
      Unmapped instances
      <span class="rounded-full bg-bg-2 px-2 py-0.5 font-mono text-micro tabular-nums text-text-3">
        {{ unmapped.length }}
      </span>
      <span class="ml-auto flex items-center gap-0.5">
        <button
          class="rounded p-1 text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
          :title="allGroupsCollapsed ? 'Expand all' : 'Collapse all'"
          @click.stop="toggleAllGroups"
          @dblclick.stop
        >
          <component
            :is="allGroupsCollapsed ? IconChevronsDown : IconChevronsUp"
            :size="14"
            :stroke-width="1.75"
          />
        </button>
        <button
          class="rounded p-1 text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
          :title="sectionCollapsed ? 'Expand' : 'Collapse'"
          @click.stop="toggleUnmapped"
        >
          <IconChevronRight
            :size="14"
            :stroke-width="2"
            class="transition-transform"
            :class="sectionCollapsed ? '' : 'rotate-90'"
          />
        </button>
      </span>
    </div>
    <template v-if="!sectionCollapsed">
      <div
        v-for="group in unmappedGroups"
        :key="group.key || 'no-system'"
      >
        <!-- group heade -->
        <div
          class="flex h-9 cursor-pointer select-none items-center gap-1.5 border-b border-border-1 pl-4 pr-2 text-micro font-medium uppercase tracking-wider text-text-4 transition-colors hover:bg-bg-2"
          :title="group.key ? `References missing system ${group.key}` : 'No system reference'"
          @click="toggleGroup(group.key)"
        >
          <span class="min-w-0 flex-1 truncate">
            {{ group.label }}
          </span>
          <span
            class="rounded-full bg-bg-2 px-2 py-0.5 font-mono text-micro tabular-nums text-text-3"
          >
            {{ group.items.length }}
          </span>
          <button
            class="rounded p-1 text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
            :title="groupCollapsed(group.key) ? 'Expand' : 'Collapse'"
            @click.stop="toggleGroup(group.key)"
          >
            <IconChevronRight
              :size="14"
              :stroke-width="2"
              class="transition-transform"
              :class="groupCollapsed(group.key) ? '' : 'rotate-90'"
            />
          </button>
        </div>
        <template v-if="!groupCollapsed(group.key)">
          <div
            v-for="inst in group.items"
            :key="inst.systemInstanceId"
            :data-row-id="inst.systemInstanceId"
            class="relative cursor-pointer border-b border-border-1 border-l-2 py-3 pr-4 transition-colors"
            :class="
              inst.systemInstanceId === activeInstanceId
                ? 'border-l-text-3 bg-bg-2'
                : 'border-l-transparent hover:bg-bg-2'
            "
            style="padding-left: 42px"
            title="Show instance details"
            @click="emit('open-instance', inst.systemInstanceId)"
          >
            <IconLayoutSidebarRight
              v-if="inst.systemInstanceId === activeInstanceId"
              :size="13"
              :stroke-width="1.75"
              class="absolute left-4 top-1/2 -translate-y-1/2 text-text-3"
              aria-label="Shown in drawer"
            />
            <div class="flex min-w-0 items-center gap-1.5">
              <div
                class="truncate text-body font-medium text-text-1"
                :title="inst.displayName"
              >
                {{ inst.displayName }}
              </div>
            </div>
            <div class="mt-2 flex items-center gap-1.5">
              <MappingTag :state="mappingState(inst)" />
              <span
                v-if="instanceContext(inst)"
                class="truncate font-mono text-meta text-text-4"
              >
                {{ instanceContext(inst) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </template>
  </template>
</template>
