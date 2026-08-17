<script setup lang="ts" generic="T extends { displayName: string }">
import { computed, nextTick, ref, watch } from 'vue'
import {
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
  IconLayoutSidebarRight,
} from '@tabler/icons-vue'
import { scrollRowIntoView } from '@/composables/useListKeyboardNav'
import { toggledSet } from '@/utils/set'
import type { BrokenRefGroup } from '@/utils/mapping'

/**
 * The "Unmapped instances" tail section of the resource lists: a collapsible
 * section of per-reference groups, each group collapsible on its own, with the
 * instance shown in the drawer highlighted and scrolled into view. The `meta`
 * slot renders each instance row's second line (mapping tag, context, ...).
 */
const props = withDefaults(
  defineProps<{
    groups: BrokenRefGroup<T>[]
    idOf: (inst: T) => string
    /** group an instance belongs to, for auto-expanding towards the drawer */
    groupKeyOf: (inst: T) => string
    /** tooltip of a group header */
    groupTitle: (key: string) => string
    /** keep everything expanded (e.g. while a search is active) */
    forceExpanded?: boolean
    /** instance currently shown in the drawer */
    activeInstanceId?: string
    /** hover tone of instance rows, matching the surrounding list */
    rowHover?: string
  }>(),
  { forceExpanded: false, activeInstanceId: '', rowHover: 'hover:bg-bg-1' },
)

const emit = defineEmits<{
  open: [id: string]
}>()

const count = computed(() => props.groups.reduce((n, g) => n + g.items.length, 0))

const unmappedCollapsed = ref(false)
// search forces the section open so matches stay visible; manual state resumes after
const sectionCollapsed = computed(() => unmappedCollapsed.value && !props.forceExpanded)

function toggleUnmapped() {
  unmappedCollapsed.value = !unmappedCollapsed.value
}

const collapsedGroups = ref<Set<string>>(new Set())

function groupCollapsed(key: string): boolean {
  return collapsedGroups.value.has(key) && !props.forceExpanded
}

function toggleGroup(key: string) {
  collapsedGroups.value = toggledSet(collapsedGroups.value, key)
}

const allGroupsCollapsed = computed(
  () => props.groups.length > 0 && props.groups.every((g) => collapsedGroups.value.has(g.key)),
)

function toggleAllGroups() {
  // reveal the section so the effect is visible even when it was collapsed
  unmappedCollapsed.value = false
  collapsedGroups.value = allGroupsCollapsed.value
    ? new Set()
    : new Set(props.groups.map((g) => g.key))
}

watch(
  () => props.activeInstanceId,
  async (id) => {
    if (!id) return
    const inst = props.groups.flatMap((g) => g.items).find((i) => props.idOf(i) === id)
    if (!inst) return
    unmappedCollapsed.value = false
    const key = props.groupKeyOf(inst)
    if (collapsedGroups.value.has(key)) {
      const s = new Set(collapsedGroups.value)
      s.delete(key)
      collapsedGroups.value = s
    }
    await nextTick()
    scrollRowIntoView(id)
  },
)
</script>

<template>
  <template v-if="count > 0">
    <div
      class="flex h-9 shrink-0 cursor-pointer select-none items-center gap-1.5 border-b border-border-1 bg-bg-1 px-2 text-micro font-medium uppercase tracking-wider text-text-4"
      :title="sectionCollapsed ? 'Double-click to expand' : 'Double-click to collapse'"
      @dblclick="toggleUnmapped"
    >
      Unmapped instances
      <span class="rounded-full bg-bg-2 px-2 py-0.5 font-mono text-micro tabular-nums text-text-3">
        {{ count }}
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
        v-for="group in groups"
        :key="group.key || 'no-reference'"
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
            :key="idOf(inst)"
            :data-row-id="idOf(inst)"
            class="relative cursor-pointer border-b border-border-1 border-l-2 py-3 pr-4 transition-colors"
            :class="
              idOf(inst) === activeInstanceId
                ? 'border-l-text-3 bg-bg-2'
                : `border-l-transparent ${rowHover}`
            "
            style="padding-left: 42px"
            title="Show instance details"
            @click="emit('open', idOf(inst))"
          >
            <IconLayoutSidebarRight
              v-if="idOf(inst) === activeInstanceId"
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
              <slot
                name="meta"
                :inst="inst"
              />
            </div>
          </div>
        </template>
      </div>
    </template>
  </template>
</template>
