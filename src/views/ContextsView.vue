<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { IconChevronsDown, IconChevronsUp } from '@tabler/icons-vue'
import { useContextStore } from '@/stores/contexts'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { GRAPH_TOGGLE_KEYS } from '@/constants/shortcuts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import ContextsList from '@/components/contexts/ContextsList.vue'
import ContextDetail from '@/components/contexts/ContextDetail.vue'
import GraphPanel from '@/components/graph/GraphPanel.vue'
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import LoadingState from '@/components/view/LoadingState.vue'
import ErrorState from '@/components/view/ErrorState.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import { useSearchMatches } from '@/composables/useResourceList'
import { useResourceSelection } from '@/composables/useResourceSelection'
import { useHierarchyRows } from '@/composables/useHierarchyRows'
import { useGraphPanel, type GraphPaneHandle } from '@/composables/useGraphPanel'
import { useTypesDrawer } from '@/composables/useTypesDrawer'
import { toggledSet } from '@/utils/set'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import type { Context } from '@/types/context'

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
  chipFilteredContexts.value.filter(
    (c) =>
      matchesQuery(search.value, c.displayName, c.contextId, c.description) ||
      matchesAnnotations(search.value, c.annotations),
  ),
)

const hasActiveFilters = computed(() => !!search.value || activeTypes.value.size > 0)

function toggleType(name: string) {
  activeTypes.value = toggledSet(activeTypes.value, name)
}

function clearFilters() {
  search.value = ''
  activeTypes.value = new Set()
}

const matchIds = useSearchMatches(
  search,
  () => store.contexts,
  (x) => x.contextId,
  (x) => [x.displayName, x.contextId, x.description],
)

const {
  selectedId,
  selected: selectedContext,
  select: selectContext,
} = useResourceSelection<Context>({
  items: () => store.contexts,
  filtered: () => filteredContexts.value,
  idOf: (c) => c.contextId,
})

const {
  collapsed,
  toggleCollapse,
  parentIds,
  allCollapsed,
  toggleAll,
  rows: contextRows,
  expandAncestors,
  activeRail,
} = useHierarchyRows<Context>({
  items: () => store.contexts,
  filtered: () => filteredContexts.value,
  idOf: (c) => c.contextId,
  parentOf: (c) => c.parentId,
  expandOnMatch: matchIds,
  selectedId,
})

// reveal the selected context's ancestors in the tree
watch(selectedId, (id) => {
  if (id) expandAncestors(id)
})

const graphPane = ref<GraphPaneHandle | null>(null)
const graphPanel = useGraphPanel({ pane: graphPane, matchIds })

useGraphKeyToggles({
  [GRAPH_TOGGLE_KEYS.graph]: graphPanel.toggleGraph,
  [GRAPH_TOGGLE_KEYS.fullscreen]: graphPanel.toggleFullscreen,
})

const typesDrawer = useTypesDrawer({
  types: () => store.contextTypes,
  idOf: (t) => t.contextTypeId,
  detail: () => store.selectedTypeDetail,
  load: store.loadContextTypes,
  loadDetail: store.loadContextTypeDetail,
  currentTypeId: () => selectedContext.value?.contextTypeId,
})
const { open: typesDrawerOpen, selectedTypeId, selectedType } = typesDrawer

useListKeyboardNav(
  computed(() => contextRows.value.map((r) => r.item.contextId)),
  selectedId,
  selectContext,
  typesDrawerOpen,
)

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
    <ViewHeader
      title="Contexts"
      :count="store.contexts.length"
    >
      <template #actions>
        <button
          class="ml-auto rounded bg-bg-2 px-2 py-1 text-meta transition-colors"
          :class="
            typesDrawerOpen
              ? 'bg-accent/10 text-accent-text'
              : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
          "
          @click="typesDrawer.openDrawer()"
        >
          Context types
        </button>
      </template>
    </ViewHeader>

    <LoadingState
      v-if="store.loading"
      label="Loading contexts..."
    />

    <ErrorState
      v-else-if="store.error && store.contexts.length === 0"
      :message="store.error"
    />

    <template v-else>
      <!-- Toolbar -->
      <FilterToolbar
        v-model:search="search"
        placeholder="Search contexts, IDs, annotations... (/)"
        :has-active-filters="hasActiveFilters"
        @clear="clearFilters"
      >
        <FilterChipGroup
          label="Type"
          :items="allTypes"
          :active="activeTypes"
          @toggle="toggleType"
        />
      </FilterToolbar>

      <EmptyState
        v-if="filteredContexts.length === 0"
        title="No contexts"
        :hint="hasActiveFilters ? 'No results for current filters' : 'No contexts discovered yet'"
      />

      <!-- list | (graph over detail) -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <ListPaneBar
              :count="filteredContexts.length"
              :total="store.contexts.length"
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
                  @click="toggleAll"
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
            :class="graphPanel.isResizing ? 'select-none' : ''"
          >
            <GraphPanel
              :panel="graphPanel"
              :can-focus="!!selectedId"
            >
              <ContextGraphPane
                ref="graphPane"
                :match-ids="matchIds"
                :contexts="chipFilteredContexts"
                :selected-id="selectedId"
                :show-controls="false"
                class="h-full"
                @select="selectContext"
              />
            </GraphPanel>

            <!-- Detail -->
            <div
              v-if="!graphPanel.fullscreen"
              class="flex min-h-0 flex-1 overflow-hidden border-t border-border-1"
            >
              <ContextDetail
                v-if="selectedContext"
                :context="selectedContext"
                @navigate-parent="selectContext"
                @open-type="typesDrawer.openType"
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
      @close="typesDrawer.close()"
    >
      <LoadingState
        v-if="store.typesLoading"
        label="Loading types..."
      />
      <template v-else>
        <!-- Type list -->
        <div class="w-52 shrink-0 overflow-y-auto border-r border-border-1">
          <div
            v-for="type in store.contextTypes"
            :key="type.contextTypeId"
            :data-row-id="type.contextTypeId"
            class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-2.5 transition-colors"
            :class="
              type.contextTypeId === selectedTypeId
                ? 'border-l-accent bg-accent/5'
                : 'border-l-transparent hover:bg-bg-1'
            "
            @click="typesDrawer.select(type.contextTypeId)"
          >
            <span class="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-meta text-accent-text">
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
            <span class="rounded bg-accent/10 px-2 py-0.5 font-mono text-label text-accent-text">
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
  </div>
</template>
