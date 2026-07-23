<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import {
  IconCircleOff,
  IconLoader2,
  IconList,
  IconHierarchy,
  IconBinaryTree,
  IconArrowDown,
  IconArrowUp,
} from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import ViewModeSwitch from '@/components/ViewModeSwitch.vue'
import SystemsToolbar from '@/components/systems/SystemsToolbar.vue'
import SystemsList from '@/components/systems/SystemsList.vue'
import SystemDetail from '@/components/systems/SystemDetail.vue'
import SystemInstancesDrawer from '@/components/systems/SystemInstancesDrawer.vue'
import { useSelectQuery } from '@/composables/useResourceNav'

// Heavy - only loaded when the graph view is first opened
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

const filteredSystems = computed(() =>
  store.systems.filter((s) => {
    const q = search.value.toLowerCase()
    if (q) {
      const inName = s.displayName.toLowerCase().includes(q)
      const inDesc = (s.description ?? '').toLowerCase().includes(q)
      const inId = s.systemId.toLowerCase().includes(q)
      const inVersion = (s.version?.version ?? '').toLowerCase().includes(q)
      const inAnnotations = Object.entries(s.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
      const inParentId = (s.parent ?? '').toLowerCase().includes(q)
      const inInstanceIds = store
        .getInstancesForSystem(s.systemId)
        .some((i) => i.systemInstanceId.toLowerCase().includes(q))
      if (
        !inName &&
        !inDesc &&
        !inId &&
        !inVersion &&
        !inAnnotations &&
        !inParentId &&
        !inInstanceIds
      )
        return false
    }
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

const hasActiveFilters = computed(
  () => !!search.value || activeKinds.value.size > 0 || activeContexts.value.size > 0,
)

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
  if (s.has(kind)) {
    s.delete(kind)
  } else {
    s.add(kind)
  }
  activeKinds.value = s
}

function toggleContext(id: string) {
  const s = new Set(activeContexts.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  activeContexts.value = s
}

function clearFilters() {
  search.value = ''
  activeKinds.value = new Set()
  activeContexts.value = new Set()
}

const viewMode = ref<'list' | 'tree' | 'graph'>('tree')

const viewModes = [
  { value: 'list', label: 'List', icon: IconList },
  { value: 'tree', label: 'Tree', icon: IconHierarchy },
  { value: 'graph', label: 'Graph', icon: IconBinaryTree },
]

const listViewMode = computed<'list' | 'tree'>(() => (viewMode.value === 'tree' ? 'tree' : 'list'))

interface TreeRow {
  system: (typeof store.systems)[number]
  depth: number
  hasChildren: boolean
}

const collapsed = ref<Set<string>>(new Set())

function toggleCollapse(id: string) {
  const s = new Set(collapsed.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  collapsed.value = s
}

const expandableIds = computed(() => {
  const present = new Set(filteredSystems.value.map((s) => s.systemId))
  const ids = new Set<string>()
  for (const s of filteredSystems.value) {
    if (s.parent && present.has(s.parent)) ids.add(s.parent)
  }
  return ids
})

const allCollapsed = computed(
  () =>
    expandableIds.value.size > 0 && [...expandableIds.value].every((id) => collapsed.value.has(id)),
)

function toggleAll() {
  collapsed.value = allCollapsed.value ? new Set() : new Set(expandableIds.value)
}

const treeRows = computed<TreeRow[]>(() => {
  const present = new Set(filteredSystems.value.map((s) => s.systemId))
  const childrenOf = new Map<string, typeof filteredSystems.value>()
  const roots: typeof filteredSystems.value = []
  for (const s of filteredSystems.value) {
    if (s.parent && present.has(s.parent)) {
      const list = childrenOf.get(s.parent) ?? []
      list.push(s)
      childrenOf.set(s.parent, list)
    } else {
      roots.push(s)
    }
  }
  const rows: TreeRow[] = []
  const walk = (s: (typeof store.systems)[number], depth: number) => {
    const kids = childrenOf.get(s.systemId) ?? []
    rows.push({ system: s, depth, hasChildren: kids.length > 0 })
    if (collapsed.value.has(s.systemId)) return
    for (const child of kids) walk(child, depth + 1)
  }
  for (const r of roots) walk(r, 0)
  return rows
})

// Selection
const selectedId = ref('')
const selectedSystem = computed(() => store.systems.find((s) => s.systemId === selectedId.value))

function selectSystem(id: string) {
  selectedId.value = id
  if (id) store.loadSystemDetail(id)
}

function onGraphSelect(id: string) {
  selectSystem(id)
  viewMode.value = 'list'
}

useSelectQuery(
  selectedId,
  computed(() => store.systems),
  (s) => s.systemId,
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

const selectedInstances = computed(() =>
  selectedId.value ? store.getInstancesForSystem(selectedId.value) : [],
)

function contextName(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  return contextStore.contextMap.get(contextId)?.displayName
}

onMounted(async () => {
  findingsStore.load()
  contextStore.ensureHydrated()
  await store.load()
  await Promise.all([store.loadAllDetails(), store.loadSystemInstances()])
})

// System Instances drawer (opened per-instance from the detail pane)
const instancesDrawerOpen = ref(false)
const selectedInstanceId = ref('')

function selectInstanceInDrawer(id: string) {
  selectedInstanceId.value = id
}

// Open the drawer focused on a specific instance (from the detail list).
function openInstanceInDrawer(id: string) {
  instancesDrawerOpen.value = true
  selectInstanceInDrawer(id)
}

function closeInstancesDrawer() {
  instancesDrawerOpen.value = false
}

// Jump from an instance to its owning system
function goToSystem(id: string) {
  if (!id) return
  instancesDrawerOpen.value = false
  selectSystem(id)
}

function goToParent(parentId: string) {
  selectSystem(parentId)
}
</script>

<template>
  <div class="relative flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <div class="flex min-w-44 items-center gap-3">
        <h1 class="text-title font-medium text-text-1">Systems</h1>
        <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3">
          {{ filteredSystems.length }}
          <span
            v-if="filteredSystems.length !== store.systems.length"
            class="text-text-4"
          >
            of {{ store.systems.length }}
          </span>
        </span>
      </div>
      <ViewModeSwitch
        v-model="viewMode"
        :options="viewModes"
      />
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
      <!-- Toolbar -->
      <SystemsToolbar
        v-model:search="search"
        :kinds="KINDS"
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
        v-if="filteredSystems.length === 0"
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
      <!-- Graph (instance landscape) -->
      <SystemGraphPane
        v-else-if="viewMode === 'graph'"
        :systems="filteredSystems"
        :selected-id="selectedId"
        class="min-h-0 flex-1"
        @select="onGraphSelect"
        @open-instance="openInstanceInDrawer"
      />
      <!-- List-Detail -->
      <ListDetail v-else>
        <!-- List -->
        <template #list>
          <div class="flex h-full flex-col">
            <div class="min-h-0 flex-1 overflow-y-auto">
              <SystemsList
                :systems="filteredSystems"
                :tree-rows="treeRows"
                :view-mode="listViewMode"
                :selected-id="selectedId"
                :collapsed="collapsed"
                @select="selectSystem"
                @toggle-collapse="toggleCollapse"
              />
            </div>
            <!-- expand / collapse all footer (tree mode) -->
            <div
              v-if="viewMode === 'tree' && expandableIds.size > 0"
              class="shrink-0 border-t border-border-1 bg-bg-0 px-3 py-2"
            >
              <button
                class="flex w-full items-center justify-center gap-1.5 rounded border border-border-1 px-2 py-1 text-meta text-text-3 transition-colors hover:bg-bg-2 hover:text-text-2"
                :title="allCollapsed ? 'Expand all' : 'Collapse all'"
                @click="toggleAll"
              >
                <component
                  :is="allCollapsed ? IconArrowDown : IconArrowUp"
                  :size="13"
                  :stroke-width="1.75"
                />
                {{ allCollapsed ? 'Expand all' : 'Collapse all' }}
              </button>
            </div>
          </div>
        </template>

        <!-- Detail -->
        <template #detail>
          <SystemDetail
            :system="selectedSystem"
            :instances="selectedInstances"
            @navigate-parent="goToParent"
            @open-instance="openInstanceInDrawer"
          />
        </template>
      </ListDetail>
    </template>

    <!-- System Instances drawer -->
    <SystemInstancesDrawer
      :open="instancesDrawerOpen"
      :selected-instance-id="selectedInstanceId"
      @close="closeInstancesDrawer"
      @go-to-system="goToSystem"
    />
  </div>
</template>