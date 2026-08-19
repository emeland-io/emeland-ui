<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import ComponentsToolbar from '@/components/components/ComponentsToolbar.vue'
import ComponentsList from '@/components/components/ComponentsList.vue'
import ComponentDetail from '@/components/components/ComponentDetail.vue'
import ComponentInstanceDrawer from '@/components/components/ComponentInstanceDrawer.vue'
import GraphPanel from '@/components/graph/GraphPanel.vue'
import GraphLayerToggle from '@/components/graph/GraphLayerToggle.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import LoadingState from '@/components/view/LoadingState.vue'
import ErrorState from '@/components/view/ErrorState.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useResourceNav } from '@/composables/useResourceNav'
import { useSearchMatches } from '@/composables/useResourceList'
import { useResourceSelection } from '@/composables/useResourceSelection'
import { useInstanceDrawer } from '@/composables/useInstanceDrawer'
import { useSystemInstanceGroups } from '@/composables/useUnmappedGroups'
import { toggledSet } from '@/utils/set'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { useGraphPanel, type GraphPaneHandle } from '@/composables/useGraphPanel'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint } from '@/constants/shortcuts'
import type { ComponentInstance } from '@/types/component'

// Heavy (VueFlow + dagre). Always visible in this layout, so it loads up front.
const ComponentGraphPane = defineAsyncComponent(
  () => import('@/components/components/ComponentGraphPane.vue'),
)

const store = useComponentStore()
const systemStore = useSystemStore()
const apiStore = useApiStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()
const { goToResource } = useResourceNav()
const { contextForInstance } = useInstanceContext()

const search = ref('')
const activeSystems = ref<Set<string>>(new Set())

const listCollapsed = ref(false)
const listCollapsedEffective = computed(() => listCollapsed.value && !search.value.trim())

function systemName(id: string): string {
  return systemStore.systemMap.get(id)?.displayName ?? id
}

const chipFilteredComponents = computed(() =>
  store.components.filter(
    (c) => activeSystems.value.size === 0 || activeSystems.value.has(c.system),
  ),
)

const filteredComponents = computed(() =>
  chipFilteredComponents.value.filter(
    (c) =>
      matchesQuery(
        search.value,
        c.displayName,
        c.description,
        c.componentId,
        c.version?.version,
        systemName(c.system),
      ) || matchesAnnotations(search.value, c.annotations),
  ),
)

const hasActiveFilters = computed(() => !!search.value || activeSystems.value.size > 0)

// instances without a resolvable parent component, filtered by the same toolbar filters
const unmappedFiltered = computed(() => {
  const base = store.unmappedInstances.filter((i) => {
    if (activeSystems.value.size > 0) {
      const system = i.systemInstance
        ? systemStore.systemInstanceMap.get(i.systemInstance)?.system
        : undefined
      if (!system || !activeSystems.value.has(system)) return false
    }
    return matchesQuery(
      search.value,
      i.displayName,
      i.componentInstanceId,
      contextForInstance(i).name,
    )
  })
  return [...base].sort(
    (a, b) =>
      a.displayName.localeCompare(b.displayName) ||
      a.componentInstanceId.localeCompare(b.componentInstanceId),
  )
})

const filterSystems = computed(() => {
  const seen = new Map<string, string>()
  for (const c of store.components) {
    if (c.system && !seen.has(c.system)) seen.set(c.system, systemName(c.system))
  }
  return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})

function toggleSystem(id: string) {
  activeSystems.value = toggledSet(activeSystems.value, id)
}

function clearFilters() {
  search.value = ''
  activeSystems.value = new Set()
}

const matchIds = useSearchMatches(
  search,
  () => store.components,
  (x) => x.componentId,
  (x) => [x.displayName, x.componentId, x.description],
)

const {
  selectedId,
  selected: selectedComponent,
  select: selectComponent,
} = useResourceSelection({
  items: () => store.components,
  filtered: () => filteredComponents.value,
  idOf: (c) => c.componentId,
  loadDetail: (id) => store.loadComponentDetail(id),
})

const { unmappedOrderedIds } = useSystemInstanceGroups(
  unmappedFiltered,
  (i) => i.systemInstance,
  (i) => i.componentInstanceId,
)

const {
  drawerOpen: instanceDrawerOpen,
  selectedInstanceId,
  openInstance,
  drawerNavIds,
  onDrawerNavExit,
  instanceCursor,
  cursorInstanceIds,
  openFirstUnmapped,
} = useInstanceDrawer<ComponentInstance>({
  instances: () => store.componentInstances,
  instanceId: (i) => i.componentInstanceId,
  instanceParent: (i) => i.component,
  unmappedOrderedIds: () => unmappedOrderedIds.value,
  unmappedFiltered: () => unmappedFiltered.value,
  selectedId,
  instancesFor: (id) => store.getInstancesForComponent(id),
  lastResourceRowId: () => filteredComponents.value.at(-1)?.componentId,
  selectResource: selectComponent,
})

useListKeyboardNav(
  computed(() =>
    listCollapsedEffective.value ? [] : filteredComponents.value.map((c) => c.componentId),
  ),
  selectedId,
  selectComponent,
  instanceDrawerOpen,
  openFirstUnmapped,
)

useInstanceCursorNav(cursorInstanceIds, instanceCursor, openInstance, instanceDrawerOpen)

// Graph controls
const graphPane = ref<GraphPaneHandle | null>(null)
const graphPanel = useGraphPanel({ pane: graphPane, matchIds })
const showInstances = ref(false)
const showUnmapped = ref(true)
const unmappedOn = computed(
  () => showInstances.value && showUnmapped.value && store.unmappedInstances.length > 0,
)
const showApis = ref(true)

function toggleInstances() {
  showInstances.value = !showInstances.value
}

function toggleApis() {
  showApis.value = !showApis.value
}

function toggleUnmapped() {
  if (!showInstances.value || store.unmappedInstances.length === 0) return
  showUnmapped.value = !showUnmapped.value
}

useGraphKeyToggles({
  [LAYER_TOGGLE_KEYS.apis]: toggleApis,
  [LAYER_TOGGLE_KEYS.instances]: toggleInstances,
  [LAYER_TOGGLE_KEYS.unmapped]: toggleUnmapped,
  [GRAPH_TOGGLE_KEYS.graph]: graphPanel.toggleGraph,
  [GRAPH_TOGGLE_KEYS.fullscreen]: graphPanel.toggleFullscreen,
})

onMounted(async () => {
  findingsStore.load()
  systemStore.load()
  systemStore.loadSystemInstances()
  contextStore.ensureHydrated()
  apiStore.load()
  await store.load()
  await store.loadAllDetails()
  store.loadComponentInstances()
})
</script>

<template>
  <div class="relative flex h-full flex-col">
    <ViewHeader
      title="Components"
      :count="store.components.length"
    >
      <span class="font-mono text-label text-text-3">
        {{ store.componentInstances.length }} instances
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
      label="Loading components..."
    />

    <ErrorState
      v-else-if="store.error && store.components.length === 0"
      :message="store.error"
    />

    <template v-else>
      <ComponentsToolbar
        v-model:search="search"
        :systems="filterSystems"
        :active-systems="activeSystems"
        :has-active-filters="hasActiveFilters"
        @toggle-system="toggleSystem"
        @clear="clearFilters"
      />

      <!-- Empty state (unmapped instances may still match the search) -->
      <EmptyState
        v-if="filteredComponents.length === 0 && unmappedFiltered.length === 0"
        title="No components"
        :hint="hasActiveFilters ? 'No results for current filters' : 'No components discovered yet'"
      />

      <!-- list | (graph over detail) -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <ListPaneBar
              :count="filteredComponents.length"
              :total="store.components.length"
              :collapsed="listCollapsedEffective"
              @toggle="listCollapsed = !listCollapsed"
            />
            <div class="min-h-0 flex-1 overflow-y-auto">
              <ComponentsList
                :components="filteredComponents"
                :selected-id="selectedId"
                :unmapped="unmappedFiltered"
                :active-instance-id="instanceDrawerOpen ? selectedInstanceId : ''"
                :force-expanded="!!search.trim()"
                :list-collapsed="listCollapsedEffective"
                @select="selectComponent"
                @open-instance="openInstance"
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
                  label="APIs"
                  :on="showApis"
                  :title="`Show APIs as nodes; when off, components link directly ${layerKeyHint('apis')}`"
                  @toggle="toggleApis"
                />
                <GraphLayerToggle
                  label="Instances"
                  :on="showInstances"
                  :title="`Show component instances as nodes ${layerKeyHint('instances')}`"
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
              <ComponentGraphPane
                ref="graphPane"
                :match-ids="new Set([...matchIds].map((id) => `comp:${id}`))"
                :components="chipFilteredComponents"
                :selected-id="selectedId"
                :cursor-id="instanceCursor"
                :suspend-cursor-follow="instanceDrawerOpen"
                :show-instances="showInstances"
                :show-unmapped="unmappedOn"
                :show-apis="showApis"
                :show-controls="false"
                class="h-full"
                @select="selectComponent"
                @open-instance="openInstance"
                @open-api="(id) => goToResource('API', id)"
              />
            </GraphPanel>

            <!-- Detail -->
            <div
              v-if="!graphPanel.fullscreen"
              class="flex min-h-0 flex-1 overflow-hidden border-t border-border-1"
            >
              <ComponentDetail :component="selectedComponent" />
            </div>
          </div>
        </template>
      </ListDetail>
    </template>

    <ComponentInstanceDrawer
      :open="instanceDrawerOpen"
      :selected-instance-id="selectedInstanceId"
      :nav-ids="drawerNavIds"
      @close="instanceDrawerOpen = false"
      @navigate="(id) => (selectedInstanceId = id)"
      @nav-exit="onDrawerNavExit"
    />
  </div>
</template>
