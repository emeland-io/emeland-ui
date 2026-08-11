<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, defineAsyncComponent } from 'vue'
import {
  IconCircleOff,
  IconLoader2,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
  IconBinaryTree,
  IconFocusCentered,
  IconZoomScan,
  IconZoomIn,
  IconZoomOut,
  IconArrowsMaximize,
  IconArrowsMinimize,
} from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import SystemsToolbar from '@/components/systems/SystemsToolbar.vue'
import SystemsList, { type SystemRow } from '@/components/systems/SystemsList.vue'
import SystemDetail from '@/components/systems/SystemDetail.vue'
import SystemInstancesDrawer from '@/components/systems/SystemInstancesDrawer.vue'
import { useSelectQuery } from '@/composables/useResourceNav'
import { useListKeyboardNav, scrollRowIntoView } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint, keyHint } from '@/constants/shortcuts'
import { groupByBrokenRef } from '@/utils/mapping'
import { useResizable } from '@/composables/useResizable'

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
  const s = new Set(activeKinds.value)
  if (s.has(kind)) s.delete(kind)
  else s.add(kind)
  activeKinds.value = s
}

function toggleContext(id: string) {
  const s = new Set(activeContexts.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  activeContexts.value = s
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

const matchIds = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q.length < 2) return new Set<string>()
  return new Set(
    store.systems
      .filter(
        (x) =>
          x.displayName.toLowerCase().includes(q) ||
          x.systemId.toLowerCase().includes(q) ||
          (x.description ?? '').toLowerCase().includes(q),
      )
      .map((x) => x.systemId),
  )
})

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
const graphPane = ref<InstanceType<typeof SystemGraphPane> | null>(null)
const graphVisible = ref(true)
const graphFullscreen = ref(false)
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

watch(
  filteredSystems,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((s) => s.systemId === selectedId.value)) {
      selectSystem(list[0].systemId)
    }
  },
  { immediate: true },
)

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
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <div class="flex min-w-44 items-center gap-3">
        <h1 class="text-title font-medium text-text-1">Systems</h1>
        <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3">
          {{ store.systems.length }}
        </span>
        <span class="font-mono text-label text-text-3">
          {{ store.systemInstances.length }} instances
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
        <span class="text-body">Loading systems...</span>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && store.systems.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-body text-error">{{ store.error }}</p>
    </div>

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

      <!-- Empty state -->
      <div
        v-if="filteredSystems.length === 0 && unmappedFiltered.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleOff
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-text-4"
          />
          <p class="mt-3 text-body text-text-2">No systems</p>
          <p class="mt-1 text-label text-text-4">
            {{ hasActiveFilters ? 'No results for current filters' : 'No systems discovered yet' }}
          </p>
        </div>
      </div>

      <!-- list | (graph over detail) -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <!-- list bar, mirroring the graph bar on the other side -->
            <div
              class="flex h-9 shrink-0 cursor-pointer select-none items-center justify-between border-b border-border-1 bg-bg-1 px-2"
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
                  {{ filteredSystems.length }}
                  <span
                    v-if="filteredSystems.length !== store.systems.length"
                    class="text-text-4"
                  >
                    of {{ store.systems.length }}
                  </span>
                </span>
              </span>
              <span class="flex items-center gap-0.5">
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
                <button
                  class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
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
              </span>
            </div>
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
                  <button
                    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    :title="`Show system instances; when off, the graph shows the system hierarchy ${layerKeyHint('instances')}`"
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
