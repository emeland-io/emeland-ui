<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { IconCircleOff, IconLoader2, IconList, IconBinaryTree } from '@tabler/icons-vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import ComponentsToolbar from '@/components/components/ComponentsToolbar.vue'
import ComponentsList from '@/components/components/ComponentsList.vue'
import ComponentDetail from '@/components/components/ComponentDetail.vue'
import ViewModeSwitch from '@/components/ViewModeSwitch.vue'
import { useSelectQuery } from '@/composables/useResourceNav'

// Heavy (VueFlow + dagre) - only loaded when the graph view is first opened
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

// Systems that own at least one component, resolved to a name and sorted.
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

const view = ref<'list' | 'graph'>('list')

const viewModes = [
  { value: 'list', label: 'List', icon: IconList },
  { value: 'graph', label: 'Graph', icon: IconBinaryTree },
]

function onGraphSelect(id: string) {
  selectComponent(id)
  view.value = 'list'
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
  contextStore.load()
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
      <div class="flex min-w-[11rem] items-center gap-3">
        <h1 class="text-base font-medium text-text-1">Components</h1>
        <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-xs text-text-3">
          {{ filteredComponents.length }}
          <span
            v-if="filteredComponents.length !== store.components.length"
            class="text-text-4"
          >
            of {{ store.components.length }}
          </span>
        </span>
      </div>
      <ViewModeSwitch
        v-model="view"
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
        <span class="text-sm">Loading components...</span>
      </div>
    </div>
    <!-- Error -->
    <div
      v-else-if="store.error && store.components.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-sm text-error">{{ store.error }}</p>
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
          <p class="mt-3 text-sm text-text-2">No components</p>
          <p class="mt-1 text-xs text-text-4">
            {{
              hasActiveFilters ? 'No results for current filters' : 'No components discovered yet'
            }}
          </p>
        </div>
      </div>
      <!-- Communication graph -->
      <ComponentGraphPane
        v-else-if="view === 'graph'"
        :components="filteredComponents"
        :selected-id="selectedId"
        class="min-h-0 flex-1"
        @select="onGraphSelect"
      />
      <ListDetail v-else>
        <template #list>
          <ComponentsList
            :components="filteredComponents"
            :selected-id="selectedId"
            @select="selectComponent"
          />
        </template>
        <template #detail>
          <ComponentDetail :component="selectedComponent" />
        </template>
      </ListDetail>
    </template>
  </div>
</template>
