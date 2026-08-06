<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
} from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import MappingTag from '@/components/MappingTag.vue'
import { endpointUrl } from '@/utils/endpoint'
import { mappingStateOf, groupByBrokenRef } from '@/utils/mapping'
import type { Api, ApiInstance } from '@/types/api'

const props = withDefaults(
  defineProps<{
    apis: Api[]
    selectedId: string
    /** apiId -> number of boundary crossings (contexts consumed in but not provided in) */
    crossings?: Map<string, number>
    /** instances without a resolvable parent API, shown in their own section */
    unmapped?: ApiInstance[]
    /** keep the unmapped section expanded (e.g. while a search is active) */
    forceExpanded?: boolean
    /** fold the main rows away (e.g. to focus on the unmapped section) */
    listCollapsed?: boolean
  }>(),
  {
    crossings: () => new Map<string, number>(),
    unmapped: () => [],
    forceExpanded: false,
    listCollapsed: false,
  },
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

// group the section by the system instance
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
  unmappedCollapsed.value = false
  collapsedGroups.value = allGroupsCollapsed.value
    ? new Set()
    : new Set(unmappedGroups.value.map((g) => g.key))
}

const store = useApiStore()
const systemStore = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

function systemName(id: string): string | undefined {
  return systemStore.systemMap.get(id)?.displayName
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function instanceCount(id: string): number {
  return store.getInstancesForApi(id).length
}

function instanceContext(inst: ApiInstance): string | undefined {
  const ctxId = inst.systemInstance
    ? systemStore.systemInstanceMap.get(inst.systemInstance)?.context
    : undefined
  return ctxId ? contextStore.contextMap.get(ctxId)?.displayName : undefined
}

function mappingState(inst: ApiInstance) {
  return mappingStateOf(inst.api, store.apiMap.has(inst.api ?? ''))
}
</script>

<template>
  <template v-if="!listCollapsed">
    <div
      v-for="api in apis"
      :key="api.apiId"
      class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
      :class="[
        api.apiId === selectedId
          ? 'border-l-accent bg-accent/5'
          : 'border-l-transparent hover:bg-bg-1',
      ]"
      @click="emit('select', api.apiId)"
    >
      <div
        class="truncate text-body font-medium text-text-1"
        :title="api.displayName"
      >
        {{ api.displayName }}
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta"
          :class="api.type === 'Unknown' ? 'text-text-4' : 'text-text-3'"
        >
          {{ api.type }}
        </span>
        <span
          v-if="systemName(api.system)"
          class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta text-text-3"
        >
          {{ systemName(api.system) }}
        </span>
        <span
          v-if="api.version?.version"
          class="font-mono text-meta text-text-4"
        >
          v{{ api.version.version }}
        </span>
        <span class="ml-auto flex shrink-0 items-center gap-1.5">
          <span
            v-if="crossings.has(api.apiId)"
            class="flex shrink-0 items-center gap-1 rounded-full border border-border-2 bg-bg-2 px-1.5 py-0.5 font-mono text-micro tabular-nums text-text-3"
            title="Crosses a context boundary"
          >
            <IconArrowsExchange
              :size="10"
              :stroke-width="2"
            />
            {{ crossings.get(api.apiId) }}
          </span>
          <span
            v-if="findingCount(api.apiId) > 0"
            class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
            :title="`${findingCount(api.apiId)} finding(s)`"
          >
            <IconAlertTriangle
              :size="10"
              :stroke-width="2"
            />
            {{ findingCount(api.apiId) }}
          </span>
          <span
            v-if="store.instancesLoaded && instanceCount(api.apiId) > 0"
            class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
            :title="`${instanceCount(api.apiId)} instance(s)`"
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
            {{ instanceCount(api.apiId) }}
          </span>
        </span>
      </div>
    </div>
  </template>

  <!-- instances without a resolvable parent API -->
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
            :key="inst.apiInstanceId"
            class="cursor-pointer border-b border-border-1 border-l-2 border-l-transparent py-3 pr-4 transition-colors hover:bg-bg-1"
            style="padding-left: 42px"
            title="Show instance details"
            @click="emit('open-instance', inst.apiInstanceId)"
          >
            <div
              class="truncate text-body font-medium text-text-1"
              :title="inst.displayName"
            >
              {{ inst.displayName }}
            </div>
            <div class="mt-2 flex items-center gap-1.5">
              <MappingTag :state="mappingState(inst)" />
              <span
                v-if="instanceContext(inst)"
                class="shrink-0 font-mono text-meta text-text-4"
              >
                {{ instanceContext(inst) }}
              </span>
              <span
                v-if="endpointUrl(inst.annotations)"
                class="ml-auto min-w-0 truncate font-mono text-meta text-text-3"
                :title="endpointUrl(inst.annotations)"
              >
                {{ endpointUrl(inst.annotations) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </template>
  </template>
</template>
