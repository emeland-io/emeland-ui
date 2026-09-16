<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IconBookmark,
  IconBookmarkFilled,
  IconLayoutGrid,
  IconTable,
  IconX,
} from '@tabler/icons-vue'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { useParametersStore } from '@/stores/parameters'
import { useOrdersStore } from '@/stores/orders'
import { useFindingsStore } from '@/stores/findings'
import { useResizable } from '@/composables/useResizable'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { useSelectQuery } from '@/composables/useResourceNav'
import { useFavorites } from '@/composables/useFavorites'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { isEditableTarget } from '@/utils/dom'
import { safeStorage } from '@/utils/storage'
import CapabilityCardGrid from '@/components/capabilities/CapabilityCardGrid.vue'
import CapabilityTable from '@/components/capabilities/CapabilityTable.vue'
import CapabilityDetail from '@/components/capabilities/CapabilityDetail.vue'
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import ResourceViewShell from '@/components/view/ResourceViewShell.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ViewModeSwitch from '@/components/ViewModeSwitch.vue'
import { LIFECYCLE_ORDER, LIFECYCLE_TAG } from '@/constants/lifecycle'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import { capabilityLifecycle } from '@/utils/version'
import { groupCapabilitiesByLifecycle } from '@/utils/capabilities'
import { toggledSet } from '@/utils/set'

/**
 * The capability catalog in two modes sharing filters, selection and the
 * docked detail: a lifecycle-grouped card grid for scanning the offering,
 * and a dense sortable table for ops work. Mode is deep-linkable
 * (?view=table) and remembered per browser.
 */
const store = useCapabilitiesStore()
const parametersStore = useParametersStore()
const ordersStore = useOrdersStore()
const findingsStore = useFindingsStore()
const route = useRoute()
const router = useRouter()

// ---- view mode (query param wins over the remembered preference)
const MODE_KEY = 'emeland-capabilities-view'
const MODES = [
  { value: 'cards', label: 'Cards', icon: IconLayoutGrid },
  { value: 'table', label: 'Table', icon: IconTable },
]
const remembered = safeStorage()?.getItem(MODE_KEY)
const initialMode = MODES.some((m) => m.value === route.query.view)
  ? (route.query.view as string)
  : MODES.some((m) => m.value === remembered)
    ? remembered!
    : 'cards'
const mode = ref(initialMode)

// drop stale ?view=graph (or any unknown mode) from the URL
if (route.query.view && route.query.view !== mode.value) {
  router.replace({
    query: { ...route.query, view: mode.value === 'cards' ? undefined : mode.value },
  })
}

watch(mode, (m) => {
  safeStorage()?.setItem(MODE_KEY, m)
  router.replace({ query: { ...route.query, view: m === 'cards' ? undefined : m } })
})

const search = ref('')
const activeLifecycles = ref<Set<string>>(new Set())
const selectedId = ref('')

// favorites are a per-browser bookmark list (localStorage), not landscape state
const { isFavorite, toggleFavorite, favoriteCount } = useFavorites()
const favoritesOnly = ref(false)

// the docked detail pane is resizable from its left edge
const {
  width: detailWidth,
  isResizing,
  onResizeStart,
} = useResizable({
  initial: 680,
  min: 280,
  max: 860,
  inverted: true,
  storageKey: 'emeland-capabilities-detail-width',
})

// only offer chips for lifecycles that actually occur in the catalog;
// the chip label matches the badges (capitalized)
const lifecycleChips = computed(() => {
  const present = new Set(store.capabilities.map((c) => capabilityLifecycle(c.versions)))
  return LIFECYCLE_ORDER.filter((l) => present.has(l)).map((l) => ({
    id: l,
    name: LIFECYCLE_TAG[l].label,
  }))
})

const chipFiltered = computed(() =>
  store.capabilities.filter(
    (c) =>
      activeLifecycles.value.size === 0 ||
      activeLifecycles.value.has(capabilityLifecycle(c.versions)),
  ),
)

const filtered = computed(() =>
  chipFiltered.value
    .filter((c) => !favoritesOnly.value || isFavorite(c.capabilityId))
    .filter(
      (c) =>
        matchesQuery(search.value, c.displayName, c.capabilityId) ||
        matchesAnnotations(search.value, c.annotations),
    ),
)

const hasActiveFilters = computed(
  () => !!search.value || activeLifecycles.value.size > 0 || favoritesOnly.value,
)

function toggleLifecycle(id: string) {
  activeLifecycles.value = toggledSet(activeLifecycles.value, id)
}

function clearFilters() {
  search.value = ''
  activeLifecycles.value = new Set()
  favoritesOnly.value = false
}

const selected = computed(() => store.capabilities.find((c) => c.capabilityId === selectedId.value))

function openCapability(id: string) {
  selectedId.value = id
  store.loadCapabilityDetail(id)
}

// ---- selection plumbing: ?select= deep links and arrow-key navigation.
// In cards mode rows follow the visual grid order (lifecycle groups,
// alphabetical within); in table mode the table reports its sort order.
useSelectQuery(
  selectedId,
  computed(() => store.capabilities),
  (c) => c.capabilityId,
)

const tableOrder = ref<string[]>([])

const cardOrder = computed(() =>
  groupCapabilitiesByLifecycle(filtered.value, isFavorite).flatMap((g) =>
    g.capabilities.map((c) => c.capabilityId),
  ),
)

useListKeyboardNav(
  computed(() => (mode.value === 'table' ? tableOrder.value : cardOrder.value)),
  selectedId,
  openCapability,
  ref(false),
)

// ESC closes the docked detail, f stars the selection (not while typing)
useWindowKeydown((e: KeyboardEvent) => {
  if (isEditableTarget(e.target) || !selectedId.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    selectedId.value = ''
    return
  }
  // plain f only, so browser find (cmd/ctrl+f) still works
  if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault()
    toggleFavorite(selectedId.value)
  }
})

onMounted(async () => {
  findingsStore.load()
  ordersStore.load()
  parametersStore.load()
  await store.load()
  await store.loadAllDetails()
})
</script>

<template>
  <ResourceViewShell
    :loading="store.loading"
    loading-label="Loading capabilities..."
    :error="store.error"
    :error-list-empty="store.capabilities.length === 0"
    retry-label="Retry"
    @retry="store.reload()"
  >
    <template #header>
      <ViewHeader
        title="Capabilities"
        :count="store.capabilities.length"
      />
    </template>

    <FilterToolbar
      v-model:search="search"
      placeholder="Search capabilities, IDs, annotations... (/)"
      :has-active-filters="hasActiveFilters"
      @clear="clearFilters"
    >
      <FilterChipGroup
        label="Lifecycle"
        :items="lifecycleChips"
        :active="activeLifecycles"
        @toggle="toggleLifecycle"
      />
      <button
        type="button"
        data-favorites-filter
        class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1 text-meta transition-colors"
        :class="favoritesOnly ? 'text-accent' : 'text-text-3 hover:text-text-1'"
        :aria-pressed="favoritesOnly"
        :title="favoritesOnly ? 'Show all capabilities' : 'Show only favorites'"
        @click="favoritesOnly = !favoritesOnly"
      >
        <component
          :is="favoritesOnly ? IconBookmarkFilled : IconBookmark"
          :size="12"
          :stroke-width="2"
        />
        Favorites
        <span class="font-mono tabular-nums text-text-4">{{ favoriteCount }}</span>
      </button>
      <template #trailing>
        <ViewModeSwitch
          v-model="mode"
          :options="MODES"
        />
      </template>
    </FilterToolbar>

    <EmptyState
      v-if="filtered.length === 0"
      title="No capabilities"
      :hint="
        favoritesOnly && favoriteCount === 0
          ? 'No favorites yet — use the bookmark on a capability to save it here'
          : hasActiveFilters
            ? 'No results for current filters'
            : 'No capabilities offered yet'
      "
    />

    <div
      v-else
      class="flex min-h-0 flex-1 overflow-hidden"
    >
      <!-- catalog: cards or table -->
      <div class="min-w-0 flex-1 overflow-y-auto">
        <CapabilityCardGrid
          v-if="mode === 'cards'"
          :capabilities="filtered"
          :selected-id="selectedId"
          @select="openCapability"
        />
        <CapabilityTable
          v-else
          :capabilities="filtered"
          :selected-id="selectedId"
          @select="openCapability"
          @order="tableOrder = $event"
        />
      </div>

      <!-- docked detail: the catalog stays visible while inspecting;
           resizable from its left edge; ESC or double-click on the
           handle closes it -->
      <div
        v-if="selected"
        class="relative flex shrink-0 flex-col overflow-hidden border-l border-border-1"
        :class="isResizing ? 'select-none' : ''"
        :style="{ width: detailWidth + 'px' }"
      >
        <div
          class="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize"
          title="Drag to resize (double-click to close)"
          @mousedown.prevent="onResizeStart"
          @dblclick.stop="selectedId = ''"
        >
          <div
            class="h-full w-0.5 transition-colors hover:bg-accent/40"
            :class="isResizing ? 'bg-accent/60' : 'bg-bg-3'"
          />
        </div>
        <div class="flex shrink-0 items-center justify-between border-b border-border-1 px-4 py-2">
          <span class="font-mono text-micro uppercase tracking-widest text-text-4">Detail</span>
          <button
            class="rounded p-1 text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
            title="Close detail"
            @click="selectedId = ''"
          >
            <IconX
              :size="13"
              :stroke-width="2"
            />
          </button>
        </div>
        <CapabilityDetail :capability="selected" />
      </div>
    </div>
  </ResourceViewShell>
</template>
