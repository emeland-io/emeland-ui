<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { IconChevronsDown, IconChevronsUp } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import SystemsToolbar from '@/components/systems/SystemsToolbar.vue'
import SystemsList, { type SystemRow } from '@/components/systems/SystemsList.vue'
import SystemDetail from '@/components/systems/SystemDetail.vue'
import SystemInstancesDrawer from '@/components/systems/SystemInstancesDrawer.vue'
import GraphPanel from '@/components/graph/GraphPanel.vue'
import GraphLayerToggle from '@/components/graph/GraphLayerToggle.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import LoadingState from '@/components/view/LoadingState.vue'
import ErrorState from '@/components/view/ErrorState.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useSelectQuery } from '@/composables/useResourceNav'
import { useAutoSelectFirst, useSearchMatches } from '@/composables/useResourceList'
import { toggledSet } from '@/utils/set'
import { useListKeyboardNav, scrollRowIntoView } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { useGraphPanel, type GraphPaneHandle } from '@/composables/useGraphPanel'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint } from '@/constants/shortcuts'
import { groupByBrokenRef } from '@/utils/mapping'

// Heavy (VueFlow + dagre). Always visible in this layout, so it loads up front.
const SystemGraphPane = defineAsyncComponent(
  () => import('@/components/systems/SystemGraphPane.vue'),
)

const store = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

const KINDS = ['Concrete', 'Abstract'] as const

const search = ref('')
const activeKinds = ref<Set<string>>(new Set())
const activeContexts = ref<Set<string>>(new Set())

function contextName(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  return contextStore.contextMap.get(contextId)?.displayName
}

const chipFilteredSystems = computed(() =>
  store.systems.filter((s) => {
    if (activeKinds.value.size > 0 && !activeKinds.value.has(store.getKindForSystem(s)))
      return false
    if (
      activeContexts.value.size > 0 &&
      !store
        .getInstancesForSystem(s.systemId)
        .some((i) => i.context && activeContexts.value.has(i.context))
    )
      return false
    return true
  }),
)

const filteredSystems = computed(() =>
  chipFilteredSystems.value.filter((s) => {
    const q = search.value.toLowerCase()
    if (!q) return true
    return (
      s.displayName.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q) ||
      s.systemId.toLowerCase().includes(q) ||
      (s.version?.version ?? '').toLowerCase().includes(q) ||
      Object.entries(s.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
    )
  }),
)

const hasActiveFilters = computed(
  () => !!search.value || activeKinds.value.size > 0 || activeContexts.value.size > 0,
)

// instances without a resolvable parent system, filtered by the same toolbar filters
const unmappedFiltered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = store.unmappedInstances.filter((i) => {
    if (activeContexts.value.size > 0 && !(i.context && activeContexts.value.has(i.context)))
      return false
    if (!q) return true
    return (
      i.displayName.toLowerCase().includes(q) ||
      i.systemInstanceId.toLowerCase().includes(q) ||
      (contextName(i.context) ?? '').toLowerCase().includes(q)
    )
  })
  return [...base].sort(
    (a, b) =>
      a.displayName.localeCompare(b.displayName) ||
      a.systemInstanceId.localeCompare(b.systemInstanceId),
  )
})

const allContexts = computed(() => {
  const seen = new Map<string, string>()
  for (const inst of store.systemInstances) {
    if (inst.context && !seen.has(inst.context)) {
      seen.set(inst.context, contextName(inst.context) ?? inst.context)
    }
  }
  return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})

function toggleKind(kind: string) {
  activeKinds.value = toggledSet(activeKinds.value, kind)
}

function toggleContext(id: string) {
  activeContexts.value = toggledSet(activeContexts.value, id)
}

function clearFilters() {
  search.value = ''
  activeKinds.value = new Set()
  activeContexts.value = new Set()
}

const collapsed = ref<Set<string>>(new Set())

const listCollapsed = ref(false)
const listCollapsedEffective = computed(() => listCollapsed.value && !search.value.trim())

let defaultCollapseApplied = false
watch(
  () => store.systems.length,
  (count) => {
    if (defaultCollapseApplied || count === 0) return
    defaultCollapseApplied = true
    const depthOf = (id: string): number => {
      let depth = 0
      let cursor = store.systems.find((x) => x.systemId === id)?.parent
      const seen = new Set<string>([id])
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor)
        depth++
        cursor = store.systems.find((x) => x.systemId === cursor)?.parent
      }
      return depth
    }
    const shut = new Set<string>()
    for (const item of store.systems) {
      const parent = item.parent
      if (parent && depthOf(parent) >= 1) shut.add(parent)
    }
    collapsed.value = shut
  },
  { immediate: true },
)

function toggleCollapse(id: string) {
  const s = new Set(collapsed.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  collapsed.value = s
}

const parentIds = computed(() => {
  const present = new Set(filteredSystems.value.map((s) => s.systemId))
  const ids = new Set<string>()
  for (const s of filteredSystems.value) {
    if (s.parent && present.has(s.parent)) ids.add(s.parent)
  }
  return ids
})

const allCollapsed = computed(
  () => parentIds.value.size > 0 && [...parentIds.value].every((id) => collapsed.value.has(id)),
)

function toggleAll() {
  collapsed.value = allCollapsed.value ? new Set() : new Set(parentIds.value)
}

const systemRows = computed<SystemRow[]>(() => {
  const present = new Set(filteredSystems.value.map((s) => s.systemId))
  const childrenOf = new Map<string, typeof filteredSystems.value>()
  const roots: typeof filteredSystems.value = []
  for (const s of filteredSystems.value) {
    if (s.parent && present.has(s.parent)) {
      childrenOf.set(s.parent, [...(childrenOf.get(s.parent) ?? []), s])
    } else {
      roots.push(s)
    }
  }
  const rows: SystemRow[] = []
  const walk = (s: (typeof store.systems)[number], depth: number, ancestors: string[]) => {
    const kids = childrenOf.get(s.systemId) ?? []
    rows.push({ system: s, depth, childCount: kids.length, ancestors })
    if (collapsed.value.has(s.systemId)) return
    for (const child of kids) walk(child, depth + 1, [...ancestors, s.systemId])
  }
  for (const r of roots) walk(r, 0, [])
  return rows
})

const activeRail = computed(
  () => store.systems.find((s) => s.systemId === selectedId.value)?.parent ?? '',
)

const matchIds = useSearchMatches(
  search,
  () => store.systems,
  (x) => x.systemId,
  (x) => [x.displayName, x.systemId, x.description],
)

watch(matchIds, (ids) => {
  if (ids.size === 0) return
  const next = new Set(collapsed.value)
  for (const id of ids) {
    let cursor: string | undefined = store.systems.find((x) => x.systemId === id)?.parent
    const seen = new Set<string>()
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor)
      next.delete(cursor)
      cursor = store.systems.find((x) => x.systemId === cursor)?.parent
    }
  }
  collapsed.value = next
})

const selectedId = ref('')
const selectedSystem = computed(() => store.systems.find((s) => s.systemId === selectedId.value))
const selectedInstances = computed(() =>
  selectedId.value ? store.getInstancesForSystem(selectedId.value) : [],
)

function selectSystem(id: string) {
  selectedId.value = id
  const next = new Set(collapsed.value)
  let cursor: string | undefined = id
  const seen = new Set<string>()
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor)
    next.delete(cursor)
    cursor = store.systems.find((x) => x.systemId === cursor)?.parent
  }
  collapsed.value = next
}

const instancesDrawerOpen = ref(false)
const selectedInstanceId = ref('')

function openInstanceInDrawer(id: string) {
  selectedInstanceId.value = id
  instancesDrawerOpen.value = true
}

const unmappedOrderedIds = computed(() =>
  groupByBrokenRef(unmappedFiltered.value, (i) => i.system, 'No system reference').flatMap((g) =>
    g.items.map((i) => i.systemInstanceId),
  ),
)

const currentIsUnmapped = computed(() =>
  unmappedFiltered.value.some((i) => i.systemInstanceId === selectedInstanceId.value),
)

const drawerNavIds = computed(() => {
  const inst = store.systemInstanceMap.get(selectedInstanceId.value)
  if (!inst) return []
  if (currentIsUnmapped.value) return unmappedOrderedIds.value
  return store.getInstancesForSystem(inst.system).map((i) => i.systemInstanceId)
})

function onDrawerNavExit(step: number) {
  if (step !== -1 || !currentIsUnmapped.value) return
  instancesDrawerOpen.value = false
  const last = systemRows.value.at(-1)?.system.systemId
  if (last) {
    selectSystem(last)
    scrollRowIntoView(last)
  }
}

const instanceCursor = ref('')

const cursorInstanceIds = computed(() =>
  selectedId.value
    ? store.getInstancesForSystem(selectedId.value).map((i) => i.systemInstanceId)
    : [],
)

watch(selectedId, () => {
  instanceCursor.value = ''
})

watch(selectedInstanceId, (id) => {
  if (!instancesDrawerOpen.value) return
  const inst = store.systemInstanceMap.get(id)
  instanceCursor.value = inst && inst.system === selectedId.value ? id : ''
})

useInstanceCursorNav(cursorInstanceIds, instanceCursor, openInstanceInDrawer, instancesDrawerOpen)

// Graph controls
const graphPane = ref<GraphPaneHandle | null>(null)
const graphPanel = useGraphPanel({ pane: graphPane, matchIds })
const showInstances = ref(true)
const showUnmapped = ref(true)
// never show the unmapped toggle as "on" when there is nothing to show —
// the explicit choice resumes as soon as unmapped instances appear again
const unmappedOn = computed(
  () => showInstances.value && showUnmapped.value && store.unmappedInstances.length > 0,
)

function toggleInstances() {
  showInstances.value = !showInstances.value
}

function toggleUnmapped() {
  if (!showInstances.value || store.unmappedInstances.length === 0) return
  showUnmapped.value = !showUnmapped.value
}

useGraphKeyToggles({
  [LAYER_TOGGLE_KEYS.instances]: toggleInstances,
  [LAYER_TOGGLE_KEYS.unmapped]: toggleUnmapped,
  [GRAPH_TOGGLE_KEYS.graph]: graphPanel.toggleGraph,
  [GRAPH_TOGGLE_KEYS.fullscreen]: graphPanel.toggleFullscreen,
})

useSelectQuery(
  selectedId,
  computed(() => store.systems),
  (s) => s.systemId,
)

useListKeyboardNav(
  computed(() =>
    listCollapsedEffective.value ? [] : systemRows.value.map((r) => r.system.systemId),
  ),
  selectedId,
  selectSystem,
  instancesDrawerOpen,
  () => {
    const first = unmappedOrderedIds.value[0]
    if (first) openInstanceInDrawer(first)
  },
)

useAutoSelectFirst(filteredSystems, (s) => s.systemId, selectedId, selectSystem)

watch(selectedId, (id) => {
  if (id) store.loadSystemDetail(id)
})

onMounted(async () => {
  findingsStore.load()
  contextStore.ensureHydrated()
  await store.load()
  await Promise.all([store.loadAllDetails(), store.loadSystemInstances()])
})
</script>

<template>
  <div class="relative flex h-full flex-col">
    <ViewHeader
      title="Systems"
      :count="store.systems.length"
    >
      <span class="font-mono text-label text-text-3">
        {{ store.systemInstances.length }} instances
      </span>
      <span
        class="font-mono text-label"
        :class="store.unmappedInstances.length > 0 ? 'text-warning' : 'text-text-4'"
      >
        {{ store.unmappedInstances.length }} unmapped
      </span>
    </ViewHeader>

    <LoadingState
      v-if="store.loading"
      label="Loading systems..."
    />

    <ErrorState
      v-else-if="store.error && store.systems.length === 0"
      :message="store.error"
    />

    <template v-else>
      <SystemsToolbar
        v-model:search="search"
        :kinds="[...KINDS]"
        :active-kinds="activeKinds"
        :contexts="allContexts"
        :active-contexts="activeContexts"
        :has-active-filters="hasActiveFilters"
        @toggle-kind="toggleKind"
        @toggle-context="toggleContext"
        @clear="clearFilters"
      />

      <EmptyState
        v-if="filteredSystems.length === 0 && unmappedFiltered.length === 0"
        title="No systems"
        :hint="hasActiveFilters ? 'No results for current filters' : 'No systems discovered yet'"
      />

      <!-- list | (graph over detail) -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <!-- list bar, mirroring the graph bar on the other side -->
            <ListPaneBar
              :count="filteredSystems.length"
              :total="store.systems.length"
              :collapsed="listCollapsedEffective"
              @toggle="listCollapsed = !listCollapsed"
            >
              <template #actions>
                <button
                  class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-3"
                  :disabled="parentIds.size === 0"
                  :title="
                    parentIds.size === 0
                      ? 'Nothing to collapse'
                      : allCollapsed
                        ? 'Expand all'
                        : 'Collapse all'
                  "
                  @click.stop="toggleAll"
                  @dblclick.stop
                >
                  <component
                    :is="allCollapsed ? IconChevronsDown : IconChevronsUp"
                    :size="14"
                    :stroke-width="1.75"
                  />
                </button>
              </template>
            </ListPaneBar>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <SystemsList
                :rows="systemRows"
                :selected-id="selectedId"
                :collapsed="collapsed"
                :active-rail="activeRail"
                :unmapped="unmappedFiltered"
                :active-instance-id="instancesDrawerOpen ? selectedInstanceId : ''"
                :force-expanded="!!search.trim()"
                :list-collapsed="listCollapsedEffective"
                @select="selectSystem"
                @toggle-collapse="toggleCollapse"
                @open-instance="openInstanceInDrawer"
              />
            </div>
          </div>
        </template>

        <template #detail>
          <div
            class="flex min-w-0 flex-1 flex-col overflow-hidden"
            :class="graphPanel.isResizing ? 'select-none' : ''"
          >
            <GraphPanel
              :panel="graphPanel"
              :can-focus="!!selectedId"
            >
              <template #layers>
                <GraphLayerToggle
                  label="Instances"
                  :on="showInstances"
                  :title="`Show system instances; when off, the graph shows the system hierarchy ${layerKeyHint('instances')}`"
                  @toggle="toggleInstances"
                />
                <GraphLayerToggle
                  label="Unmapped"
                  :on="unmappedOn"
                  :disabled="!showInstances || store.unmappedInstances.length === 0"
                  :title="
                    store.unmappedInstances.length === 0
                      ? 'No unmapped instances present'
                      : showInstances
                        ? `Show unmapped instances as nodes ${layerKeyHint('unmapped')}`
                        : 'Enable Instances to show unmapped instances'
                  "
                  @toggle="toggleUnmapped"
                />
              </template>
              <SystemGraphPane
                ref="graphPane"
                :match-ids="matchIds"
                :systems="chipFilteredSystems"
                :selected-id="selectedId"
                :cursor-id="instanceCursor"
                :suspend-cursor-follow="instancesDrawerOpen"
                :show-instances="showInstances"
                :show-unmapped="unmappedOn"
                :show-controls="false"
                class="h-full"
                @select="selectSystem"
                @open-instance="openInstanceInDrawer"
              />
            </GraphPanel>

            <!-- Detail -->
            <div
              v-if="!graphPanel.fullscreen"
              class="flex min-h-0 flex-1 overflow-hidden border-t border-border-1"
            >
              <SystemDetail
                :system="selectedSystem"
                :instances="selectedInstances"
                :active-instance-id="instancesDrawerOpen ? selectedInstanceId : ''"
                @navigate-parent="selectSystem"
                @open-instance="openInstanceInDrawer"
              />
            </div>
          </div>
        </template>
      </ListDetail>
    </template>

    <SystemInstancesDrawer
      :open="instancesDrawerOpen"
      :selected-instance-id="selectedInstanceId"
      :nav-ids="drawerNavIds"
      @close="instancesDrawerOpen = false"
      @navigate="(id) => (selectedInstanceId = id)"
      @nav-exit="onDrawerNavExit"
      @go-to-system="
        (id) => {
          instancesDrawerOpen = false
          selectSystem(id)
        }
      "
    />
  </div>
</template>
