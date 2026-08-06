<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, defineAsyncComponent } from 'vue'
import {
  IconCircleOff,
  IconLoader2,
  IconChevronRight,
  IconFocusCentered,
  IconZoomScan,
  IconZoomIn,
  IconZoomOut,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconBinaryTree,
} from '@tabler/icons-vue'
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
import { useResourceNav, useSelectQuery } from '@/composables/useResourceNav'
import { useResizable } from '@/composables/useResizable'
import { resolveApiContextFlows } from '@/utils/apiContexts'
import { endpointUrl } from '@/utils/endpoint'

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
  const s = new Set(activeSystems.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  activeSystems.value = s
}

function toggleType(type: string) {
  const s = new Set(activeTypes.value)
  if (s.has(type)) {
    s.delete(type)
  } else {
    s.add(type)
  }
  activeTypes.value = s
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

const matchIds = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q.length < 2) return new Set<string>()
  return new Set(
    store.apis
      .filter(
        (x) =>
          x.displayName.toLowerCase().includes(q) ||
          x.apiId.toLowerCase().includes(q) ||
          (x.description ?? '').toLowerCase().includes(q),
      )
      .map((x) => x.apiId),
  )
})

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

// Graph controls
const graphPane = ref<InstanceType<typeof ApiGraphPane> | null>(null)
const graphVisible = ref(true)
const graphFullscreen = ref(false)
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

function refitGraph() {
  if (!graphVisible.value) return
  nextTick(() => requestAnimationFrame(() => graphPane.value?.fit()))
}

function toggleGraph() {
  graphVisible.value = !graphVisible.value
  if (!graphVisible.value) {
    graphFullscreen.value = false
    return
  }
  if (graphHeight.value < SNAP_CLOSE) graphHeight.value = DEFAULT_HEIGHT
  refitGraph()
}

function toggleFullscreen() {
  graphFullscreen.value = !graphFullscreen.value
  if (graphFullscreen.value) graphVisible.value = true
}

const SNAP_CLOSE = 100
const DEFAULT_HEIGHT = 320

const {
  size: graphHeight,
  isResizing: isResizingGraph,
  onResizeStart: onGraphResizeStart,
} = useResizable({ initial: DEFAULT_HEIGHT, min: 48, max: 700, axis: 'y' })

watch(graphHeight, (h) => {
  if (!isResizingGraph.value) return
  graphVisible.value = h >= SNAP_CLOSE
})

watch(matchIds, (ids) => {
  if (ids.size === 0) return
  nextTick(() => graphPane.value?.focusMatches())
})

watch(isResizingGraph, (resizing) => {
  if (!resizing) refitGraph()
})

function onGraphHandleDown(e: MouseEvent) {
  if (!graphVisible.value) graphHeight.value = SNAP_CLOSE
  onGraphResizeStart(e)
}

useSelectQuery(
  selectedId,
  computed(() => store.apis),
  (a) => a.apiId,
)

watch(
  filteredApis,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((a) => a.apiId === selectedId.value)) {
      selectApi(list[0].apiId)
    }
  },
  { immediate: true },
)

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
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <div class="flex min-w-44 items-center gap-3">
        <h1 class="text-title font-medium text-text-1">APIs</h1>
        <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3">
          {{ store.apis.length }}
        </span>
        <span class="font-mono text-label text-text-3">
          {{ store.apiInstances.length }} instances
        </span>
        <span
          class="font-mono text-label"
          :class="store.unmappedInstances.length > 0 ? 'text-warning' : 'text-text-4'"
        >
          {{ store.unmappedInstances.length }} unmapped
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="store.loading"
      class="flex flex-1 items-center justify-center"
    >
      <div class="flex items-center gap-2 text-text-3">
        <IconLoader2
          :size="16"
          :stroke-width="1.5"
          class="animate-spin"
        />
        <span class="text-body">Loading APIs...</span>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && store.apis.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-body text-error">{{ store.error }}</p>
    </div>

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

      <!-- Empty state -->
      <div
        v-if="filteredApis.length === 0 && unmappedFiltered.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleOff
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-text-4"
          />
          <p class="mt-3 text-body text-text-2">No APIs</p>
          <p class="mt-1 text-label text-text-4">
            {{ hasActiveFilters ? 'No results for current filters' : 'No APIs discovered yet' }}
          </p>
        </div>
      </div>

      <!-- list | (graph over detail) -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <div
              class="flex h-9 shrink-0 cursor-pointer select-none items-center border-b border-border-1 bg-bg-1 px-2"
              :title="
                listCollapsedEffective ? 'Double-click to expand' : 'Double-click to collapse'
              "
              @dblclick="listCollapsed = !listCollapsed"
            >
              <span class="flex items-center gap-1.5">
                <span class="text-micro font-medium uppercase tracking-wider text-text-4">
                  List
                </span>
                <span
                  class="rounded-full bg-bg-2 px-2 py-0.5 font-mono text-micro tabular-nums text-text-3"
                >
                  {{ filteredApis.length }}
                  <span
                    v-if="filteredApis.length !== store.apis.length"
                    class="text-text-4"
                  >
                    of {{ store.apis.length }}
                  </span>
                </span>
              </span>
              <button
                class="ml-auto rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                :title="listCollapsedEffective ? 'Expand' : 'Collapse'"
                @click.stop="listCollapsed = !listCollapsed"
                @dblclick.stop
              >
                <IconChevronRight
                  :size="14"
                  :stroke-width="2"
                  class="transition-transform"
                  :class="listCollapsedEffective ? '' : 'rotate-90'"
                />
              </button>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <ApisList
                :apis="filteredApis"
                :selected-id="selectedId"
                :crossings="crossings"
                :unmapped="unmappedFiltered"
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
            :class="isResizingGraph ? 'select-none' : ''"
          >
            <!-- Graph toolbar -->
            <div
              class="grid h-9 shrink-0 cursor-pointer select-none grid-cols-[1fr_auto_1fr] items-center border-b border-border-1 bg-bg-1 px-2"
              :title="graphVisible ? 'Double-click to hide graph' : 'Double-click to show graph'"
              @dblclick="toggleGraph"
            >
              <span class="text-micro font-medium uppercase tracking-wider text-text-4">Graph</span>
              <div class="flex items-center gap-1">
                <template v-if="graphVisible">
                  <button
                    class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-3"
                    title="Focus selection"
                    :disabled="!selectedId"
                    @click.stop="graphPane?.focusSelected()"
                    @dblclick.stop
                  >
                    <IconFocusCentered
                      :size="14"
                      :stroke-width="1.75"
                    />
                  </button>
                  <button
                    class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    title="Fit to view"
                    @click.stop="graphPane?.fit()"
                    @dblclick.stop
                  >
                    <IconZoomScan
                      :size="14"
                      :stroke-width="1.75"
                    />
                  </button>
                  <button
                    class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    title="Zoom out"
                    @click.stop="graphPane?.zoomOut()"
                    @dblclick.stop
                  >
                    <IconZoomOut
                      :size="14"
                      :stroke-width="1.75"
                    />
                  </button>
                  <button
                    class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    title="Zoom in"
                    @click.stop="graphPane?.zoomIn()"
                    @dblclick.stop
                  >
                    <IconZoomIn
                      :size="14"
                      :stroke-width="1.75"
                    />
                  </button>
                  <div class="mx-0.5 h-4 w-px bg-bg-3" />
                  <button
                    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    title="Show providing and consuming components; when off, APIs link directly"
                    @click.stop="toggleComponents"
                    @dblclick.stop
                  >
                    Components
                    <span
                      class="rounded px-1 py-0.5 font-mono text-micro transition-colors"
                      :class="
                        showComponents ? 'bg-accent/15 text-accent-text' : 'bg-bg-0 text-text-4'
                      "
                    >
                      {{ showComponents ? 'on' : 'off' }}
                    </span>
                  </button>
                  <button
                    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    title="Show API instances as nodes; unmapped ones appear as standalone nodes"
                    @click.stop="toggleInstances"
                    @dblclick.stop
                  >
                    Instances
                    <span
                      class="rounded px-1 py-0.5 font-mono text-micro transition-colors"
                      :class="
                        showInstances ? 'bg-accent/15 text-accent-text' : 'bg-bg-0 text-text-4'
                      "
                    >
                      {{ showInstances ? 'on' : 'off' }}
                    </span>
                  </button>
                  <button
                    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-3"
                    :disabled="!showInstances || store.unmappedInstances.length === 0"
                    :title="
                      store.unmappedInstances.length === 0
                        ? 'No unmapped instances present'
                        : showInstances
                          ? 'Show unmapped instances as nodes'
                          : 'Enable Instances to show unmapped instances'
                    "
                    @click.stop="showUnmapped = !showUnmapped"
                    @dblclick.stop
                  >
                    Unmapped
                    <span
                      class="rounded px-1 py-0.5 font-mono text-micro transition-colors"
                      :class="unmappedOn ? 'bg-accent/15 text-accent-text' : 'bg-bg-0 text-text-4'"
                    >
                      {{ unmappedOn ? 'on' : 'off' }}
                    </span>
                  </button>
                  <div class="mx-0.5 h-4 w-px bg-bg-3" />
                  <button
                    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta transition-colors hover:bg-bg-3"
                    :class="graphFullscreen ? 'text-accent' : 'text-text-3 hover:text-text-1'"
                    @click.stop="toggleFullscreen"
                    @dblclick.stop
                  >
                    <component
                      :is="graphFullscreen ? IconArrowsMinimize : IconArrowsMaximize"
                      :size="14"
                      :stroke-width="1.75"
                    />
                    {{ graphFullscreen ? 'Exit full view' : 'Full view' }}
                  </button>
                </template>
                <button
                  class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                  @click.stop="toggleGraph"
                  @dblclick.stop
                >
                  <IconBinaryTree
                    :size="14"
                    :stroke-width="1.75"
                  />
                  {{ graphVisible ? 'Hide graph' : 'Show graph' }}
                </button>
              </div>
              <span />
            </div>

            <!-- Graph -->
            <div
              v-show="graphVisible"
              class="relative overflow-hidden"
              :class="graphFullscreen ? 'min-h-0 flex-1' : 'shrink-0'"
              :style="graphFullscreen ? undefined : { height: graphHeight + 'px' }"
            >
              <button
                v-if="graphFullscreen"
                class="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded border border-border-1 bg-bg-1/90 px-2 py-1 text-meta text-text-3 transition-colors hover:bg-bg-2 hover:text-text-1"
                title="Back to the split layout"
                @click="toggleFullscreen"
              >
                <IconArrowsMinimize
                  :size="14"
                  :stroke-width="1.75"
                />
                Exit full view
              </button>
              <ApiGraphPane
                ref="graphPane"
                :match-ids="new Set([...matchIds].map((id) => `api:${id}`))"
                :apis="chipFilteredApis"
                :selected-id="selectedId"
                :show-components="showComponents"
                :show-instances="showInstances"
                :show-unmapped="unmappedOn"
                :show-controls="false"
                class="h-full"
                @select="selectApi"
                @open-component="(id) => goToResource('Component', id)"
                @open-instance="openInstance"
              />
            </div>

            <div
              v-if="!graphFullscreen"
              class="h-0.5 shrink-0 cursor-row-resize transition-colors hover:bg-accent/40"
              :class="isResizingGraph ? 'bg-accent/60' : 'bg-bg-3'"
              :title="graphVisible ? 'Drag to resize' : 'Drag to open the graph'"
              @mousedown.prevent="onGraphHandleDown"
            />

            <!-- Detail -->
            <div
              v-if="!graphFullscreen"
              class="flex min-h-0 flex-1 overflow-hidden border-t border-border-1"
            >
              <ApiDetail
                :api="selectedApi"
                :flow="selectedFlow"
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
      @close="instanceDrawerOpen = false"
    />
  </div>
</template>
