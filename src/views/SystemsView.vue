<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { IconChevronsDown, IconChevronsUp } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import SystemsToolbar from '@/components/systems/SystemsToolbar.vue'
import SystemsList from '@/components/systems/SystemsList.vue'
import SystemDetail from '@/components/systems/SystemDetail.vue'
import SystemInstancesDrawer from '@/components/systems/SystemInstancesDrawer.vue'
import GraphPanel from '@/components/graph/GraphPanel.vue'
import GraphLayerToggle from '@/components/graph/GraphLayerToggle.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import LoadingState from '@/components/view/LoadingState.vue'
import ErrorState from '@/components/view/ErrorState.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useSearchMatches } from '@/composables/useResourceList'
import { useResourceSelection } from '@/composables/useResourceSelection'
import { useInstanceDrawer } from '@/composables/useInstanceDrawer'
import { useHierarchyRows } from '@/composables/useHierarchyRows'
import { useSystemRefGroups } from '@/composables/useUnmappedGroups'
import { useContextLabels } from '@/composables/useContextLabels'
import { toggledSet } from '@/utils/set'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { useGraphPanel, type GraphPaneHandle } from '@/composables/useGraphPanel'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint } from '@/constants/shortcuts'
import type { System, SystemInstance } from '@/types/system'

// Heavy (VueFlow + dagre). Always visible in this layout, so it loads up front.
const SystemGraphPane = defineAsyncComponent(
  () => import('@/components/systems/SystemGraphPane.vue'),
)

const store = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()
const { contextName } = useContextLabels()

const KINDS = ['Concrete', 'Abstract'] as const

const search = ref('')
const activeKinds = ref<Set<string>>(new Set())
const activeContexts = ref<Set<string>>(new Set())

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
  chipFilteredSystems.value.filter(
    (s) =>
      matchesQuery(search.value, s.displayName, s.description, s.systemId, s.version?.version) ||
      matchesAnnotations(search.value, s.annotations),
  ),
)

const hasActiveFilters = computed(
  () => !!search.value || activeKinds.value.size > 0 || activeContexts.value.size > 0,
)

// instances without a resolvable parent system, filtered by the same toolbar filters
const unmappedFiltered = computed(() => {
  const base = store.unmappedInstances.filter((i) => {
    if (activeContexts.value.size > 0 && !(i.context && activeContexts.value.has(i.context)))
      return false
    return matchesQuery(search.value, i.displayName, i.systemInstanceId, contextName(i.context))
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

const listCollapsed = ref(false)
const listCollapsedEffective = computed(() => listCollapsed.value && !search.value.trim())

const matchIds = useSearchMatches(
  search,
  () => store.systems,
  (x) => x.systemId,
  (x) => [x.displayName, x.systemId, x.description],
)

const {
  selectedId,
  selected: selectedSystem,
  select: selectSystem,
} = useResourceSelection<System>({
  items: () => store.systems,
  filtered: () => filteredSystems.value,
  idOf: (s) => s.systemId,
  loadDetail: (id) => store.loadSystemDetail(id),
})

const {
  collapsed,
  toggleCollapse,
  parentIds,
  allCollapsed,
  toggleAll,
  rows: systemRows,
  expandAncestors,
  activeRail,
} = useHierarchyRows<System>({
  items: () => store.systems,
  filtered: () => filteredSystems.value,
  idOf: (s) => s.systemId,
  parentOf: (s) => s.parent,
  expandOnMatch: matchIds,
  selectedId,
})

// reveal the selected system's ancestors in the tree
watch(selectedId, (id) => {
  if (id) expandAncestors(id)
})

const selectedInstances = computed(() =>
  selectedId.value ? store.getInstancesForSystem(selectedId.value) : [],
)

const { unmappedOrderedIds } = useSystemRefGroups(
  unmappedFiltered,
  (i) => i.system,
  (i) => i.systemInstanceId,
)

const {
  drawerOpen: instancesDrawerOpen,
  selectedInstanceId,
  openInstance: openInstanceInDrawer,
  drawerNavIds,
  onDrawerNavExit,
  instanceCursor,
  cursorInstanceIds,
  openFirstUnmapped,
} = useInstanceDrawer<SystemInstance>({
  instances: () => store.systemInstances,
  instanceId: (i) => i.systemInstanceId,
  instanceParent: (i) => i.system,
  unmappedOrderedIds: () => unmappedOrderedIds.value,
  unmappedFiltered: () => unmappedFiltered.value,
  selectedId,
  instancesFor: (id) => store.getInstancesForSystem(id),
  lastResourceRowId: () => systemRows.value.at(-1)?.item.systemId,
  selectResource: selectSystem,
})

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

useListKeyboardNav(
  computed(() =>
    listCollapsedEffective.value ? [] : systemRows.value.map((r) => r.item.systemId),
  ),
  selectedId,
  selectSystem,
  instancesDrawerOpen,
  openFirstUnmapped,
)

useInstanceCursorNav(cursorInstanceIds, instanceCursor, openInstanceInDrawer, instancesDrawerOpen)

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
