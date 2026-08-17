<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import ApisToolbar from '@/components/apis/ApisToolbar.vue'
import ApisList from '@/components/apis/ApisList.vue'
import ApiDetail from '@/components/apis/ApiDetail.vue'
import ApiInstanceDrawer from '@/components/apis/ApiInstanceDrawer.vue'
import GraphPanel from '@/components/graph/GraphPanel.vue'
import GraphLayerToggle from '@/components/graph/GraphLayerToggle.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import LoadingState from '@/components/view/LoadingState.vue'
import ErrorState from '@/components/view/ErrorState.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useResourceNav, useSelectQuery } from '@/composables/useResourceNav'
import { useAutoSelectFirst, useSearchMatches } from '@/composables/useResourceList'
import { toggledSet } from '@/utils/set'
import { resolveApiContextFlows } from '@/utils/apiContexts'
import { endpointUrl } from '@/utils/endpoint'
import { groupByBrokenRef } from '@/utils/mapping'
import { useListKeyboardNav, scrollRowIntoView } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { useGraphPanel, type GraphPaneHandle } from '@/composables/useGraphPanel'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint } from '@/constants/shortcuts'
import type { ApiInstance } from '@/types/api'

// Heavy (VueFlow + dagre). Always visible in this layout, so it loads up front.
const ApiGraphPane = defineAsyncComponent(() => import('@/components/apis/ApiGraphPane.vue'))

const store = useApiStore()
const systemStore = useSystemStore()
const componentStore = useComponentStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()
const { goToResource } = useResourceNav()

const search = ref('')
const activeSystems = ref<Set<string>>(new Set())
const activeTypes = ref<Set<string>>(new Set())
const crossContextOnly = ref(false)

const listCollapsed = ref(false)
const listCollapsedEffective = computed(() => listCollapsed.value && !search.value.trim())

const TYPE_ORDER = ['OpenAPI', 'GraphQL', 'gRPC', 'Other', 'Unknown']

function systemName(id: string): string {
  return systemStore.systemMap.get(id)?.displayName ?? id
}

const contextFlows = computed(() =>
  resolveApiContextFlows({
    apis: store.apis,
    components: componentStore.components,
    componentInstances: componentStore.componentInstances,
    systemInstances: systemStore.systemInstances,
  }),
)

const crossings = computed(
  () =>
    new Map<string, number>(
      [...contextFlows.value]
        .filter(([, f]) => f.crosses)
        .map(([id, f]) => [id, f.crossContexts.length]),
    ),
)

const chipFilteredApis = computed(() =>
  store.apis.filter(
    (a) =>
      (activeSystems.value.size === 0 || activeSystems.value.has(a.system)) &&
      (activeTypes.value.size === 0 || activeTypes.value.has(a.type)) &&
      (!crossContextOnly.value || crossings.value.has(a.apiId)),
  ),
)

const filteredApis = computed(() =>
  chipFilteredApis.value.filter((a) => {
    const q = search.value.toLowerCase()
    if (!q) return true
    return (
      a.displayName.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      a.apiId.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.version?.version ?? '').toLowerCase().includes(q) ||
      systemName(a.system).toLowerCase().includes(q) ||
      Object.entries(a.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
    )
  }),
)

const hasActiveFilters = computed(
  () =>
    !!search.value ||
    activeSystems.value.size > 0 ||
    activeTypes.value.size > 0 ||
    crossContextOnly.value,
)

// instances without a resolvable parent API, filtered by the same toolbar filters
const unmappedFiltered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = store.unmappedInstances.filter((i) => {
    if (activeSystems.value.size > 0) {
      const system = i.systemInstance
        ? systemStore.systemInstanceMap.get(i.systemInstance)?.system
        : undefined
      if (!system || !activeSystems.value.has(system)) return false
    }
    if (!q) return true
    return (
      i.displayName.toLowerCase().includes(q) ||
      i.apiInstanceId.toLowerCase().includes(q) ||
      (endpointUrl(i.annotations) ?? '').toLowerCase().includes(q)
    )
  })
  return [...base].sort(
    (a, b) =>
      a.displayName.localeCompare(b.displayName) || a.apiInstanceId.localeCompare(b.apiInstanceId),
  )
})

const filterSystems = computed(() => {
  const seen = new Map<string, string>()
  for (const a of store.apis) {
    if (a.system && !seen.has(a.system)) seen.set(a.system, systemName(a.system))
  }
  return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})

function toggleSystem(id: string) {
  activeSystems.value = toggledSet(activeSystems.value, id)
}

function toggleType(type: string) {
  activeTypes.value = toggledSet(activeTypes.value, type)
}

function clearFilters() {
  search.value = ''
  activeSystems.value = new Set()
  activeTypes.value = new Set()
  crossContextOnly.value = false
}

// API types present in the loaded data, in display order
const filterTypes = computed(() => {
  const present = new Set(store.apis.map((a) => a.type))
  return TYPE_ORDER.filter((t) => present.has(t as (typeof store.apis)[number]['type']))
})

const matchIds = useSearchMatches(
  search,
  () => store.apis,
  (x) => x.apiId,
  (x) => [x.displayName, x.apiId, x.description],
)

const selectedId = ref('')
const selectedApi = computed(() => store.apis.find((a) => a.apiId === selectedId.value))
const selectedFlow = computed(() =>
  selectedId.value ? contextFlows.value.get(selectedId.value) : undefined,
)

function selectApi(id: string) {
  selectedId.value = id
}

const instanceDrawerOpen = ref(false)
const selectedInstanceId = ref('')

function openInstance(id: string) {
  selectedInstanceId.value = id
  instanceDrawerOpen.value = true
}

useListKeyboardNav(
  computed(() => (listCollapsedEffective.value ? [] : filteredApis.value.map((a) => a.apiId))),
  selectedId,
  selectApi,
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
  ).flatMap((g) => g.items.map((i) => i.apiInstanceId)),
)

const currentIsUnmapped = computed(() =>
  unmappedFiltered.value.some((i) => i.apiInstanceId === selectedInstanceId.value),
)

const drawerNavIds = computed(() => {
  const inst = store.apiInstances.find((i) => i.apiInstanceId === selectedInstanceId.value)
  if (!inst) return []
  if (currentIsUnmapped.value) return unmappedOrderedIds.value
  return byContextThenName(store.getInstancesForApi(inst.api ?? '')).map((i) => i.apiInstanceId)
})

function byContextThenName(instances: ApiInstance[]): ApiInstance[] {
  return [...instances].sort(
    (a, b) =>
      (instanceContextName(a) ?? '').localeCompare(instanceContextName(b) ?? '') ||
      a.displayName.localeCompare(b.displayName),
  )
}

function instanceContextName(inst: ApiInstance): string | undefined {
  const ctxId = inst.systemInstance
    ? systemStore.systemInstanceMap.get(inst.systemInstance)?.context
    : undefined
  return ctxId ? contextStore.contextMap.get(ctxId)?.displayName : undefined
}

function onDrawerNavExit(step: number) {
  if (step !== -1 || !currentIsUnmapped.value) return
  instanceDrawerOpen.value = false
  const last = filteredApis.value.at(-1)?.apiId
  if (last) {
    selectApi(last)
    scrollRowIntoView(last)
  }
}

const instanceCursor = ref('')

const cursorInstanceIds = computed(() =>
  selectedId.value
    ? byContextThenName(store.getInstancesForApi(selectedId.value)).map((i) => i.apiInstanceId)
    : [],
)

watch(selectedId, () => {
  instanceCursor.value = ''
})

watch(selectedInstanceId, (id) => {
  if (!instanceDrawerOpen.value) return
  const inst = store.apiInstances.find((i) => i.apiInstanceId === id)
  instanceCursor.value = inst && inst.api === selectedId.value ? id : ''
})

useInstanceCursorNav(cursorInstanceIds, instanceCursor, openInstance, instanceDrawerOpen)

// Graph controls
const graphPane = ref<GraphPaneHandle | null>(null)
const graphPanel = useGraphPanel({ pane: graphPane, matchIds })
const showComponents = ref(true)
const showInstances = ref(false)
const showUnmapped = ref(true)
const unmappedOn = computed(
  () => showInstances.value && showUnmapped.value && store.unmappedInstances.length > 0,
)

function toggleComponents() {
  showComponents.value = !showComponents.value
}

function toggleInstances() {
  showInstances.value = !showInstances.value
}

function toggleUnmapped() {
  if (!showInstances.value || store.unmappedInstances.length === 0) return
  showUnmapped.value = !showUnmapped.value
}

useGraphKeyToggles({
  [LAYER_TOGGLE_KEYS.components]: toggleComponents,
  [LAYER_TOGGLE_KEYS.instances]: toggleInstances,
  [LAYER_TOGGLE_KEYS.unmapped]: toggleUnmapped,
  [GRAPH_TOGGLE_KEYS.graph]: graphPanel.toggleGraph,
  [GRAPH_TOGGLE_KEYS.fullscreen]: graphPanel.toggleFullscreen,
})

useSelectQuery(
  selectedId,
  computed(() => store.apis),
  (a) => a.apiId,
)

useAutoSelectFirst(filteredApis, (a) => a.apiId, selectedId, selectApi)

watch(selectedId, (id) => {
  if (id) store.loadApiDetail(id)
})

onMounted(async () => {
  findingsStore.load()
  systemStore.load()
  systemStore.loadSystemInstances()
  contextStore.ensureHydrated()
  await Promise.all([store.load(), componentStore.load()])
  await Promise.all([store.loadAllDetails(), componentStore.loadAllDetails()])
  store.loadApiInstances()
  componentStore.loadComponentInstances()
})
</script>

<template>
  <div class="relative flex h-full flex-col">
    <ViewHeader
      title="APIs"
      :count="store.apis.length"
    >
      <span class="font-mono text-label text-text-3">
        {{ store.apiInstances.length }} instances
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
      label="Loading APIs..."
    />

    <ErrorState
      v-else-if="store.error && store.apis.length === 0"
      :message="store.error"
    />

    <template v-else>
      <ApisToolbar
        v-model:search="search"
        :systems="filterSystems"
        :active-systems="activeSystems"
        :types="filterTypes"
        :active-types="activeTypes"
        :cross-context="crossContextOnly"
        :has-active-filters="hasActiveFilters"
        @toggle-system="toggleSystem"
        @toggle-type="toggleType"
        @toggle-cross-context="crossContextOnly = !crossContextOnly"
        @clear="clearFilters"
      />

      <EmptyState
        v-if="filteredApis.length === 0 && unmappedFiltered.length === 0"
        title="No APIs"
        :hint="hasActiveFilters ? 'No results for current filters' : 'No APIs discovered yet'"
      />

      <!-- list | (graph over detail) -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <ListPaneBar
              :count="filteredApis.length"
              :total="store.apis.length"
              :collapsed="listCollapsedEffective"
              @toggle="listCollapsed = !listCollapsed"
            />
            <div class="min-h-0 flex-1 overflow-y-auto">
              <ApisList
                :apis="filteredApis"
                :selected-id="selectedId"
                :crossings="crossings"
                :unmapped="unmappedFiltered"
                :active-instance-id="instanceDrawerOpen ? selectedInstanceId : ''"
                :force-expanded="!!search.trim()"
                :list-collapsed="listCollapsedEffective"
                @select="selectApi"
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
                  label="Components"
                  :on="showComponents"
                  :title="`Show providing and consuming components; when off, APIs link directly ${layerKeyHint('components')}`"
                  @toggle="toggleComponents"
                />
                <GraphLayerToggle
                  label="Instances"
                  :on="showInstances"
                  :title="`Show API instances as nodes; unmapped ones appear as standalone nodes ${layerKeyHint('instances')}`"
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
              <ApiGraphPane
                ref="graphPane"
                :match-ids="new Set([...matchIds].map((id) => `api:${id}`))"
                :apis="chipFilteredApis"
                :selected-id="selectedId"
                :cursor-id="instanceCursor"
                :suspend-cursor-follow="instanceDrawerOpen"
                :show-components="showComponents"
                :show-instances="showInstances"
                :show-unmapped="unmappedOn"
                :show-controls="false"
                class="h-full"
                @select="selectApi"
                @open-component="(id) => goToResource('Component', id)"
                @open-instance="openInstance"
              />
            </GraphPanel>

            <!-- Detail -->
            <div
              v-if="!graphPanel.fullscreen"
              class="flex min-h-0 flex-1 overflow-hidden border-t border-border-1"
            >
              <ApiDetail
                :api="selectedApi"
                :flow="selectedFlow"
                :active-instance-id="instanceDrawerOpen ? selectedInstanceId : ''"
                @open-instance="openInstance"
              />
            </div>
          </div>
        </template>
      </ListDetail>
    </template>

    <ApiInstanceDrawer
      :open="instanceDrawerOpen"
      :selected-instance-id="selectedInstanceId"
      :nav-ids="drawerNavIds"
      @close="instanceDrawerOpen = false"
      @navigate="(id) => (selectedInstanceId = id)"
      @nav-exit="onDrawerNavExit"
    />
  </div>
</template>
