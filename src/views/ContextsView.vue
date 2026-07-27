<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, defineAsyncComponent } from 'vue'
import {
  IconCircleOff,
  IconLoader2,
  IconChevronsDown,
  IconChevronsUp,
  IconBinaryTree,
  IconFocusCentered,
  IconZoomScan,
  IconZoomIn,
  IconZoomOut,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconSearch,
  IconX,
} from '@tabler/icons-vue'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import ContextsList, { type ContextRow } from '@/components/contexts/ContextsList.vue'
import ContextDetail from '@/components/contexts/ContextDetail.vue'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import SystemInstancesDrawer from '@/components/systems/SystemInstancesDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import { useSelectQuery, useResourceNav } from '@/composables/useResourceNav'
import { useResizable } from '@/composables/useResizable'

// Heavy (VueFlow + dagre). Always visible in this layout, so it loads up front.
const ContextGraphPane = defineAsyncComponent(
  () => import('@/components/contexts/ContextGraphPane.vue'),
)

const store = useContextStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()

const search = ref('')
const activeTypes = ref<Set<string>>(new Set())

const allTypes = computed(() =>
  [...new Set(store.contexts.map((c) => store.getTypeName(c)))].sort(),
)

const chipFilteredContexts = computed(() =>
  store.contexts.filter(
    (c) => activeTypes.value.size === 0 || activeTypes.value.has(store.getTypeName(c)),
  ),
)

const filteredContexts = computed(() =>
  chipFilteredContexts.value.filter((c) => {
    const q = search.value.trim().toLowerCase()
    if (!q) return true
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.contextId.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      Object.entries(c.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
    )
  }),
)

const hasActiveFilters = computed(() => !!search.value || activeTypes.value.size > 0)

function toggleType(name: string) {
  const s = new Set(activeTypes.value)
  if (s.has(name)) s.delete(name)
  else s.add(name)
  activeTypes.value = s
}

function clearFilters() {
  search.value = ''
  activeTypes.value = new Set()
}

const collapsed = ref<Set<string>>(new Set())

let defaultCollapseApplied = false
watch(
  () => store.contexts.length,
  (count) => {
    if (defaultCollapseApplied || count === 0) return
    defaultCollapseApplied = true
    const depthOf = (id: string): number => {
      let depth = 0
      let cursor = store.contexts.find((x) => x.contextId === id)?.parentId
      const seen = new Set<string>([id])
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor)
        depth++
        cursor = store.contexts.find((x) => x.contextId === cursor)?.parentId
      }
      return depth
    }
    const shut = new Set<string>()
    for (const item of store.contexts) {
      const parent = item.parentId
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
  const present = new Set(filteredContexts.value.map((c) => c.contextId))
  const ids = new Set<string>()
  for (const c of filteredContexts.value) {
    if (c.parentId && present.has(c.parentId)) ids.add(c.parentId)
  }
  return ids
})

const allCollapsed = computed(
  () => parentIds.value.size > 0 && [...parentIds.value].every((id) => collapsed.value.has(id)),
)

function toggleAll() {
  collapsed.value = allCollapsed.value ? new Set() : new Set(parentIds.value)
}

const contextRows = computed<ContextRow[]>(() => {
  const present = new Set(filteredContexts.value.map((c) => c.contextId))
  const childrenOf = new Map<string, typeof filteredContexts.value>()
  const roots: typeof filteredContexts.value = []
  for (const c of filteredContexts.value) {
    if (c.parentId && present.has(c.parentId)) {
      childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c])
    } else {
      roots.push(c)
    }
  }
  const rows: ContextRow[] = []
  const walk = (c: (typeof store.contexts)[number], depth: number, ancestors: string[]) => {
    const kids = childrenOf.get(c.contextId) ?? []
    rows.push({ context: c, depth, childCount: kids.length, ancestors })
    if (collapsed.value.has(c.contextId)) return
    for (const child of kids) walk(child, depth + 1, [...ancestors, c.contextId])
  }
  for (const r of roots) walk(r, 0, [])
  return rows
})

const activeRail = computed(
  () => store.contexts.find((c) => c.contextId === selectedId.value)?.parentId ?? '',
)

const matchIds = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q.length < 2) return new Set<string>()
  return new Set(
    store.contexts
      .filter(
        (x) =>
          x.displayName.toLowerCase().includes(q) ||
          x.contextId.toLowerCase().includes(q) ||
          (x.description ?? '').toLowerCase().includes(q),
      )
      .map((x) => x.contextId),
  )
})

watch(matchIds, (ids) => {
  if (ids.size === 0) return
  const next = new Set(collapsed.value)
  for (const id of ids) {
    let cursor: string | undefined = store.contexts.find((x) => x.contextId === id)?.parentId
    const seen = new Set<string>()
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor)
      next.delete(cursor)
      cursor = store.contexts.find((x) => x.contextId === cursor)?.parentId
    }
  }
  collapsed.value = next
})

const selectedId = ref('')
const selectedContext = computed(() => store.contexts.find((c) => c.contextId === selectedId.value))

function selectContext(id: string) {
  selectedId.value = id
  const next = new Set(collapsed.value)
  let cursor: string | undefined = id
  const seen = new Set<string>()
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor)
    next.delete(cursor)
    cursor = store.contexts.find((x) => x.contextId === cursor)?.parentId
  }
  collapsed.value = next
}

const instanceDrawerOpen = ref(false)
const selectedInstanceId = ref('')

const { goToResource } = useResourceNav()

function goToSystem(id: string) {
  instanceDrawerOpen.value = false
  goToResource('System', id)
}

function openInstance(id: string) {
  selectedInstanceId.value = id
  instanceDrawerOpen.value = true
}

const graphPane = ref<InstanceType<typeof ContextGraphPane> | null>(null)
const graphVisible = ref(true)
const graphFullscreen = ref(false)
const showInstances = ref(false)

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
  refitGraph()
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
  computed(() => store.contexts),
  (c) => c.contextId,
)

watch(
  filteredContexts,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((c) => c.contextId === selectedId.value)) {
      selectContext(list[0].contextId)
    }
  },
  { immediate: true },
)

const typesDrawerOpen = ref(false)
const selectedTypeId = ref('')

const selectedType = computed(() => {
  const detail = store.selectedTypeDetail
  if (detail && detail.contextTypeId === selectedTypeId.value) return detail
  return store.contextTypes.find((t) => t.contextTypeId === selectedTypeId.value)
})

async function openTypesDrawer() {
  typesDrawerOpen.value = true
  await store.loadContextTypes()
  const typeId = selectedContext.value?.contextTypeId
  if (typeId && store.contextTypes.some((t) => t.contextTypeId === typeId)) {
    selectTypeInDrawer(typeId)
  } else if (!selectedTypeId.value && store.contextTypes.length > 0) {
    selectTypeInDrawer(store.contextTypes[0].contextTypeId)
  }
}

function selectTypeInDrawer(id: string) {
  selectedTypeId.value = id
  if (id) store.loadContextTypeDetail(id)
}

async function openTypeInDrawer(contextTypeId: string) {
  typesDrawerOpen.value = true
  await store.loadContextTypes()
  if (store.contextTypes.some((t) => t.contextTypeId === contextTypeId)) {
    selectTypeInDrawer(contextTypeId)
  }
}

function closeTypesDrawer() {
  typesDrawerOpen.value = false
}

// Jump to the parent context
onMounted(async () => {
  findingsStore.load()
  systemStore.load()
  systemStore.loadSystemInstances()
  await store.ensureHydrated()
})
</script>

<template>
  <div class="relative flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <div class="flex min-w-44 items-center gap-3">
        <h1 class="text-title font-medium text-text-1">Contexts</h1>
        <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3">
          {{ filteredContexts.length }}
          <span
            v-if="filteredContexts.length !== store.contexts.length"
            class="text-text-4"
          >
            of {{ store.contexts.length }}
          </span>
        </span>
      </div>
      <button
        class="ml-auto rounded bg-bg-2 px-2 py-1 text-meta transition-colors"
        :class="
          typesDrawerOpen
            ? 'bg-accent/10 text-accent-text'
            : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
        "
        @click="openTypesDrawer"
      >
        Context types
      </button>
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
        <span class="text-body">Loading contexts...</span>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && store.contexts.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-body text-error">{{ store.error }}</p>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
        <div
          class="flex items-center gap-2 rounded bg-bg-2 px-2.5 py-1.5 transition-shadow focus-within:ring-1 focus-within:ring-border-2"
          style="min-width: 260px"
        >
          <IconSearch
            :size="13"
            :stroke-width="1.5"
            class="shrink-0 text-text-4"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Search contexts, IDs, annotations..."
            class="w-full bg-transparent font-mono text-label text-text-2 outline-none placeholder:text-meta placeholder:text-text-4"
          />
          <button
            v-if="search"
            class="shrink-0 rounded p-0.5 text-text-4 transition-colors hover:bg-bg-3 hover:text-text-2"
            title="Clear search"
            @click="search = ''"
          >
            <IconX
              :size="12"
              :stroke-width="2"
            />
          </button>
        </div>

        <div
          v-if="allTypes.length > 0"
          class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1"
        >
          <span
            class="shrink-0 cursor-default select-none text-micro font-medium uppercase tracking-wider text-text-4"
          >
            Type
          </span>
          <button
            v-for="type in allTypes"
            :key="type"
            class="rounded px-2 py-0.5 font-mono text-meta transition-colors"
            :class="
              activeTypes.has(type)
                ? 'bg-accent/10 text-accent-text'
                : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
            "
            @click="toggleType(type)"
          >
            {{ type }}
          </button>
        </div>

        <button
          v-if="hasActiveFilters"
          class="ml-auto flex items-center gap-1 text-meta text-text-4 hover:text-text-2"
          @click="clearFilters"
        >
          Clear
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredContexts.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleOff
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-text-4"
          />
          <p class="mt-3 text-body text-text-2">No contexts</p>
          <p class="mt-1 text-label text-text-4">
            {{ hasActiveFilters ? 'No results for current filters' : 'No contexts discovered yet' }}
          </p>
        </div>
      </div>

      <!-- list | (graph over detail) -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <div
              class="flex h-9 shrink-0 items-center justify-between border-b border-border-1 bg-bg-1 px-2"
            >
              <span class="text-micro font-medium uppercase tracking-wider text-text-4">List</span>
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
                @click="toggleAll"
              >
                <component
                  :is="allCollapsed ? IconChevronsDown : IconChevronsUp"
                  :size="14"
                  :stroke-width="1.75"
                />
              </button>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <ContextsList
                :rows="contextRows"
                :selected-id="selectedId"
                :collapsed="collapsed"
                :active-rail="activeRail"
                @select="selectContext"
                @toggle-collapse="toggleCollapse"
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
                  <button
                    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
                    title="Show the system instances living in each context"
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
              <!-- A second way back out of full view -->
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
              <ContextGraphPane
                ref="graphPane"
                :match-ids="matchIds"
                :contexts="chipFilteredContexts"
                :selected-id="selectedId"
                :show-instances="showInstances"
                :show-controls="false"
                class="h-full"
                @select="selectContext"
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
              <ContextDetail
                v-if="selectedContext"
                :context="selectedContext"
                @navigate-parent="selectContext"
                @open-type="openTypeInDrawer"
              />
              <div
                v-else
                class="flex flex-1 items-center justify-center"
              >
                <span class="font-mono text-label text-text-4">Select a context</span>
              </div>
            </div>
          </div>
        </template>
      </ListDetail>
    </template>
    <!-- context types drawer -->
    <SlideOverDrawer
      :open="typesDrawerOpen"
      title="Context Types"
      subtitle="ContextType"
      :count="store.typesLoaded ? store.contextTypes.length : undefined"
      @close="closeTypesDrawer"
    >
      <div
        v-if="store.typesLoading"
        class="flex flex-1 items-center justify-center"
      >
        <div class="flex items-center gap-2 text-text-3">
          <IconLoader2
            :size="16"
            :stroke-width="1.5"
            class="animate-spin"
          />
          <span class="text-body">Loading types...</span>
        </div>
      </div>
      <template v-else>
        <!-- Type list -->
        <div class="w-52 shrink-0 overflow-y-auto border-r border-border-1">
          <div
            v-for="type in store.contextTypes"
            :key="type.contextTypeId"
            class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-2.5 transition-colors"
            :class="
              type.contextTypeId === selectedTypeId
                ? 'border-l-accent bg-accent/5'
                : 'border-l-transparent hover:bg-bg-1'
            "
            @click="selectTypeInDrawer(type.contextTypeId)"
          >
            <span class="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-meta text-accent">
              {{ type.displayName }}
            </span>
          </div>
        </div>
        <!-- Type detail -->
        <div
          v-if="selectedType"
          class="flex-1 overflow-y-auto px-6 py-5"
        >
          <div class="flex items-center gap-2">
            <span class="rounded bg-accent/10 px-2 py-0.5 font-mono text-label text-accent">
              {{ selectedType.displayName }}
            </span>
            <span class="font-mono text-label text-text-4">{{ selectedType.contextTypeId }}</span>
            <CopyButton
              :value="selectedType.contextTypeId"
              :size="13"
            />
          </div>
          <p
            v-if="selectedType.description"
            class="mt-4 text-body leading-relaxed text-text-2"
          >
            {{ selectedType.description }}
          </p>
          <div
            v-if="Object.keys(selectedType.annotations).length > 0"
            class="mt-6"
          >
            <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
              Annotations
            </div>
            <div
              v-for="(value, key) in selectedType.annotations"
              :key="key"
              class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
              style="grid-template-columns: minmax(180px, 30%) minmax(0, 1fr)"
            >
              <span
                class="truncate text-text-3"
                :title="key"
              >
                {{ key }}
              </span>
              <span class="break-all text-text-2">{{ value }}</span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex flex-1 items-center justify-center"
        >
          <span class="font-mono text-label text-text-4">Select a context type</span>
        </div>
      </template>
    </SlideOverDrawer>
    <SystemInstancesDrawer
      :open="instanceDrawerOpen"
      :selected-instance-id="selectedInstanceId"
      @close="instanceDrawerOpen = false"
      @go-to-system="goToSystem"
    />
  </div>
</template>
