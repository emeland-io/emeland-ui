<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, defineAsyncComponent } from 'vue'
import {
  IconCircleOff,
  IconLoader2,
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
import { useSelectQuery } from '@/composables/useResourceNav'
import { useResizable } from '@/composables/useResizable'

// Heavy. Always visible in this layout, so it loads up front.
const ComponentGraphPane = defineAsyncComponent(
  () => import('@/components/components/ComponentGraphPane.vue'),
)

const store = useComponentStore()
const systemStore = useSystemStore()
const apiStore = useApiStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

const search = ref('')
const activeSystems = ref<Set<string>>(new Set())

function systemName(id: string): string {
  return systemStore.systemMap.get(id)?.displayName ?? id
}

const filteredComponents = computed(() =>
  store.components.filter((c) => {
    const q = search.value.toLowerCase()
    if (q) {
      const inName = c.displayName.toLowerCase().includes(q)
      const inDesc = (c.description ?? '').toLowerCase().includes(q)
      const inId = c.componentId.toLowerCase().includes(q)
      const inVersion = (c.version?.version ?? '').toLowerCase().includes(q)
      const inSystem = systemName(c.system).toLowerCase().includes(q)
      const inAnnotations = Object.entries(c.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
      if (!inName && !inDesc && !inId && !inVersion && !inSystem && !inAnnotations) return false
    }
    if (activeSystems.value.size > 0 && !activeSystems.value.has(c.system)) return false
    return true
  }),
)

const hasActiveFilters = computed(() => !!search.value || activeSystems.value.size > 0)

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

const selectedId = ref('')
const selectedComponent = computed(() =>
  store.components.find((c) => c.componentId === selectedId.value),
)

function selectComponent(id: string) {
  selectedId.value = id
}

// Graph controls
const graphPane = ref<InstanceType<typeof ComponentGraphPane> | null>(null)
const graphVisible = ref(true)
const graphFullscreen = ref(false)

function toggleGraph() {
  graphVisible.value = !graphVisible.value
  if (!graphVisible.value) {
    graphFullscreen.value = false
    return
  }
  nextTick(() => graphPane.value?.fit())
}

function toggleFullscreen() {
  graphFullscreen.value = !graphFullscreen.value
  if (graphFullscreen.value) graphVisible.value = true
  nextTick(() => graphPane.value?.fit())
}

const {
  size: graphHeight,
  isResizing: isResizingGraph,
  onResizeStart: onGraphResizeStart,
} = useResizable({ initial: 320, min: 160, max: 700, axis: 'y' })

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
          {{ filteredComponents.length }}
          <span
            v-if="filteredComponents.length !== store.components.length"
            class="text-text-4"
          >
            of {{ store.components.length }}
          </span>
        </span>
      </div>
      <span class="font-mono text-meta text-text-4">split layout</span>
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

      <!-- Empty state -->
      <div
        v-if="filteredComponents.length === 0"
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
          <ComponentsList
            :components="filteredComponents"
            :selected-id="selectedId"
            @select="selectComponent"
          />
        </template>

        <template #detail>
          <div
            class="flex min-w-0 flex-1 flex-col overflow-hidden"
            :class="isResizingGraph ? 'select-none' : ''"
          >
            <!-- Graph toolbar -->
            <div
              class="grid shrink-0 cursor-pointer select-none grid-cols-[1fr_auto_1fr] items-center border-b border-border-1 bg-bg-1 px-2 py-1"
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
                    class="rounded p-1 transition-colors hover:bg-bg-3"
                    :class="graphFullscreen ? 'text-accent' : 'text-text-3 hover:text-text-1'"
                    :title="graphFullscreen ? 'Exit full view' : 'Full view'"
                    @click.stop="toggleFullscreen"
                    @dblclick.stop
                  >
                    <component
                      :is="graphFullscreen ? IconArrowsMinimize : IconArrowsMaximize"
                      :size="14"
                      :stroke-width="1.75"
                    />
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
              class="overflow-hidden"
              :class="graphFullscreen ? 'min-h-0 flex-1' : 'shrink-0'"
              :style="graphFullscreen ? undefined : { height: graphHeight + 'px' }"
            >
              <ComponentGraphPane
                ref="graphPane"
                :components="filteredComponents"
                :selected-id="selectedId"
                class="h-full"
                @select="selectComponent"
              />
            </div>

            <!-- Resize handle -->
            <div
              v-if="graphVisible && !graphFullscreen"
              class="h-0.5 shrink-0 cursor-row-resize transition-colors hover:bg-accent/40"
              :class="isResizingGraph ? 'bg-accent/60' : 'bg-bg-3'"
              @mousedown.prevent="onGraphResizeStart"
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
  </div>
</template>