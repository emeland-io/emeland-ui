<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import {
  IconAlertTriangle,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
  IconLayoutSidebarRight,
} from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useComponentStore } from '@/stores/components'
import { useFindingsStore } from '@/stores/findings'
import MappingTag from '@/components/MappingTag.vue'
import { mappingStateOf, groupByBrokenRef } from '@/utils/mapping'
import { scrollRowIntoView } from '@/composables/useListKeyboardNav'
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
const unmappedCollapsed = ref(false)
// search forces the section open so matches stay visible; manual state resumes after
const sectionCollapsed = computed(() => unmappedCollapsed.value && !props.forceExpanded)

function toggleUnmapped() {
  unmappedCollapsed.value = !unmappedCollapsed.value
}

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
    const inst = props.unmapped.find((i) => i.componentInstanceId === id)
    if (!inst) return
    unmappedCollapsed.value = false
    const key = inst.systemInstance || ''
    if (collapsedGroups.value.has(key)) {
      const s = new Set(collapsedGroups.value)
      s.delete(key)
      collapsedGroups.value = s
    }
    await nextTick()
    scrollRowIntoView(id)
  },
)

const systemStore = useSystemStore()
const contextStore = useContextStore()
const store = useComponentStore()
const findingsStore = useFindingsStore()

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
  const ctxId = inst.systemInstance
    ? systemStore.systemInstanceMap.get(inst.systemInstance)?.context
    : undefined
  return ctxId ? contextStore.contextMap.get(ctxId)?.displayName : undefined
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
        :key="group.key || 'no-system-instance'"
      >
        <!-- group header -->
        <div
          class="flex h-9 cursor-pointer select-none items-center gap-1.5 border-b border-border-1 pl-4 pr-2 text-micro font-medium uppercase tracking-wider text-text-4 transition-colors hover:bg-bg-2"
          :title="groupTitle(group.key)"
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
            :key="inst.componentInstanceId"
            :data-row-id="inst.componentInstanceId"
            class="relative cursor-pointer border-b border-border-1 border-l-2 py-3 pr-4 transition-colors"
            :class="
              inst.componentInstanceId === activeInstanceId
                ? 'border-l-text-3 bg-bg-2'
                : 'border-l-transparent hover:bg-bg-1'
            "
            style="padding-left: 42px"
            title="Show instance details"
            @click="emit('open-instance', inst.componentInstanceId)"
          >
            <IconLayoutSidebarRight
              v-if="inst.componentInstanceId === activeInstanceId"
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
              <span
                v-else-if="systemInstanceName(inst.systemInstance)"
                class="truncate font-mono text-meta text-text-4"
                :title="systemInstanceName(inst.systemInstance)"
              >
                {{ systemInstanceName(inst.systemInstance) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </template>
  </template>
</template>
