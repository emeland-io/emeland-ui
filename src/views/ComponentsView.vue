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
import { useSelectQuery, useResourceNav } from '@/composables/useResourceNav'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { groupByBrokenRef } from '@/utils/mapping'
import { useListKeyboardNav, scrollRowIntoView } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint, keyHint } from '@/constants/shortcuts'
import { useResizable } from '@/composables/useResizable'

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
  chipFilteredComponents.value.filter((c) => {
    const q = search.value.toLowerCase()
    if (!q) return true
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      c.componentId.toLowerCase().includes(q) ||
      (c.version?.version ?? '').toLowerCase().includes(q) ||
      systemName(c.system).toLowerCase().includes(q) ||
      Object.entries(c.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
    )
  }),
)

const hasActiveFilters = computed(() => !!search.value || activeSystems.value.size > 0)

// instances without a resolvable parent component, filtered by the same toolbar filters
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
      i.componentInstanceId.toLowerCase().includes(q) ||
      (contextForInstance(i).name ?? '').toLowerCase().includes(q)
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
  const s = new Set(activeSystems.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  activeSystems.value = s
}

function clearFilters() {
  search.value = ''
  activeSystems.value = new Set()
}

const matchIds = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q.length < 2) return new Set<string>()
  return new Set(
    store.components
      .filter(
        (x) =>
          x.displayName.toLowerCase().includes(q) ||
          x.componentId.toLowerCase().includes(q) ||
          (x.description ?? '').toLowerCase().includes(q),
      )
      .map((x) => x.componentId),
  )
})

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
const graphPane = ref<InstanceType<typeof ComponentGraphPane> | null>(null)
const graphVisible = ref(true)
const graphFullscreen = ref(false)
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
  [GRAPH_TOGGLE_KEYS.graph]: toggleGraph,
  [GRAPH_TOGGLE_KEYS.fullscreen]: toggleFullscreen,
})

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
  computed(() => store.components),
  (c) => c.componentId,
)

watch(
  filteredComponents,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((c) => c.componentId === selectedId.value)) {
      selectComponent(list[0].componentId)
    }
  },
  { immediate: true },
)

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
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <div class="flex min-w-44 items-center gap-3">
        <h1 class="text-title font-medium text-text-1">Components</h1>
        <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3">
          {{ store.components.length }}
        </span>
        <span class="font-mono text-label text-text-3">
          {{ store.componentInstances.length }} instances
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
        <span class="text-body">Loading components...</span>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && store.components.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-body text-error">{{ store.error }}</p>
    </div>

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
      <div
        v-if="filteredComponents.length === 0 && unmappedFiltered.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleOff
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-text-4"
          />
          <p class="mt-3 text-body text-text-2">No components</p>
          <p class="mt-1 text-label text-text-4">
            {{
              hasActiveFilters ? 'No results for current filters' : 'No components discovered yet'
            }}
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
                  {{ filteredComponents.length }}
                  <span
                    v-if="filteredComponents.length !== store.components.length"
                    class="text-text-4"
                  >
                    of {{ store.components.length }}
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
                    title="Fit to view (0) — Shift+click focuses an area"
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
                    title="Zoom out (−)"
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
                    title="Zoom in (+)"
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
                    :title="`Show APIs as nodes; when off, components link directly ${layerKeyHint('apis')}`"
                    @click.stop="toggleApis"
                    @dblclick.stop
                  >
                    APIs
                    <span
                      class="rounded px-1 py-0.5 font-mono text-micro transition-colors"
                      :class="showApis ? 'bg-accent/15 text-accent-text' : 'bg-bg-0 text-text-4'"
                    >
                      {{ showApis ? 'on' : 'off' }}
                    </span>
                  </button>
                  <button
                    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    :title="`Show component instances as nodes ${layerKeyHint('instances')}`"
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
                          ? `Show unmapped instances as nodes ${layerKeyHint('unmapped')}`
                          : 'Enable Instances to show unmapped instances'
                    "
                    @click.stop="toggleUnmapped"
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
                    :title="`Toggle fullscreen graph ${keyHint(GRAPH_TOGGLE_KEYS.fullscreen)}`"
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
                  :title="`Show or hide the graph ${keyHint(GRAPH_TOGGLE_KEYS.graph)}`"
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
