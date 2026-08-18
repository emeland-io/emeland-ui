<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
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
import { useSelectQuery, useResourceNav } from '@/composables/useResourceNav'
import { useAutoSelectFirst, useSearchMatches } from '@/composables/useResourceList'
import { toggledSet } from '@/utils/set'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { groupByBrokenRef } from '@/utils/mapping'
import { useListKeyboardNav, scrollRowIntoView } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { useGraphPanel, type GraphPaneHandle } from '@/composables/useGraphPanel'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint } from '@/constants/shortcuts'

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

const selectedId = ref('')
const selectedComponent = computed(() =>
  store.components.find((c) => c.componentId === selectedId.value),
)

function selectComponent(id: string) {
  selectedId.value = id
}

const instanceDrawerOpen = ref(false)
const selectedInstanceId = ref('')

function openInstance(id: string) {
  selectedInstanceId.value = id
  instanceDrawerOpen.value = true
}

useListKeyboardNav(
  computed(() =>
    listCollapsedEffective.value ? [] : filteredComponents.value.map((c) => c.componentId),
  ),
  selectedId,
  selectComponent,
  instanceDrawerOpen,
  () => {
    const first = unmappedOrderedIds.value[0]
    if (first) openInstance(first)
  },
)

const unmappedOrderedIds = computed(() =>
  groupByBrokenRef(
    unmappedFiltered.value,
    (i) => i.systemInstance,
    'No system instance',
    (key) => systemStore.systemInstanceMap.get(key)?.displayName,
    (key) => systemStore.systemInstanceMap.has(key),
  ).flatMap((g) => g.items.map((i) => i.componentInstanceId)),
)

const currentIsUnmapped = computed(() =>
  unmappedFiltered.value.some((i) => i.componentInstanceId === selectedInstanceId.value),
)

const drawerNavIds = computed(() => {
  const inst = store.componentInstances.find(
    (i) => i.componentInstanceId === selectedInstanceId.value,
  )
  if (!inst) return []
  if (currentIsUnmapped.value) return unmappedOrderedIds.value
  return store.getInstancesForComponent(inst.component ?? '').map((i) => i.componentInstanceId)
})

function onDrawerNavExit(step: number) {
  if (step !== -1 || !currentIsUnmapped.value) return
  instanceDrawerOpen.value = false
  const last = filteredComponents.value.at(-1)?.componentId
  if (last) {
    selectComponent(last)
    scrollRowIntoView(last)
  }
}

const instanceCursor = ref('')

const cursorInstanceIds = computed(() =>
  selectedId.value
    ? store.getInstancesForComponent(selectedId.value).map((i) => i.componentInstanceId)
    : [],
)

watch(selectedId, () => {
  instanceCursor.value = ''
})

watch(selectedInstanceId, (id) => {
  if (!instanceDrawerOpen.value) return
  const inst = store.componentInstances.find((i) => i.componentInstanceId === id)
  instanceCursor.value = inst && inst.component === selectedId.value ? id : ''
})

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

useSelectQuery(
  selectedId,
  computed(() => store.components),
  (c) => c.componentId,
)

useAutoSelectFirst(filteredComponents, (c) => c.componentId, selectedId, selectComponent)

watch(selectedId, (id) => {
  if (id) store.loadComponentDetail(id)
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
