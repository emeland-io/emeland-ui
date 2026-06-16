<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { IconSearch, IconCircleOff, IconLoader2, IconCategory } from '@tabler/icons-vue'
import { useNodesStore } from '@/stores/nodes'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'

const store = useNodesStore()

// TODO: Should be in a dedicated place
const NODE_COLORS: Record<string, string> = {
  Sensor: 'bg-node-sensor/10 text-node-sensor',
  Filter: 'bg-node-filter/10 text-node-filter',
  Injector: 'bg-node-injector/10 text-node-injector',
  External: 'bg-node-external/10 text-node-external',
}
const DEFAULT_NODE_COLOR = 'bg-bg-2 text-text-3'

function nodeColor(typeName: string): string {
  return NODE_COLORS[typeName] ?? DEFAULT_NODE_COLOR
}

function nodeVersion(annotations: Record<string, string>): string | undefined {
  const entry = Object.entries(annotations).find(([k]) => k.endsWith('/version') || k === 'version')
  return entry?.[1]
}

// Filters
const search = ref('')
const activeTypes = ref<Set<string>>(new Set())

const allTypes = computed(() => [...new Set(store.nodes.map((n) => store.getTypeName(n)))])

const filteredNodes = computed(() =>
  store.nodes.filter((n) => {
    const q = search.value.toLowerCase()
    if (q) {
      const inName = n.displayName.toLowerCase().includes(q)
      const inAnnotations = Object.entries(n.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
      if (!inName && !inAnnotations) return false
    }
    if (activeTypes.value.size > 0 && !activeTypes.value.has(store.getTypeName(n))) return false
    return true
  }),
)

const hasActiveFilters = computed(() => !!search.value || activeTypes.value.size > 0)

function toggleType(name: string) {
  const s = new Set(activeTypes.value)
  if (s.has(name)) {
    s.delete(name)
  } else {
    s.add(name)
  }
  activeTypes.value = s
}
function clearFilters() {
  search.value = ''
  activeTypes.value = new Set()
}

// Selection
const selectedId = ref('')
const selectedNode = computed(() => store.nodes.find((n) => n.nodeId === selectedId.value))

watch(
  filteredNodes,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((n) => n.nodeId === selectedId.value)) {
      selectedId.value = list[0].nodeId
    }
  },
  { immediate: true },
)

// Resize
const listWidth = ref(320)
const isResizing = ref(false)
let cleanupResize: (() => void) | null = null

function onResizeStart(e: MouseEvent) {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = listWidth.value
  function onMove(ev: MouseEvent) {
    listWidth.value = Math.max(220, Math.min(600, startWidth + (ev.clientX - startX)))
  }
  function onUp() {
    isResizing.value = false
    cleanupResize?.()
    cleanupResize = null
  }
  cleanupResize = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

onMounted(() => store.load())
onUnmounted(() => cleanupResize?.())

// Node Types drawer
const typesDrawerOpen = ref(false)
const selectedTypeId = ref('')
const selectedType = computed(() =>
  store.nodeTypes.find((t) => t.nodeTypeId === selectedTypeId.value),
)

function openTypesDrawer() {
  typesDrawerOpen.value = true
  // preselect the type of the currently selected node
  const nodeTypeId = selectedNode.value?.nodeType
  if (nodeTypeId && store.nodeTypes.some((t) => t.nodeTypeId === nodeTypeId)) {
    selectedTypeId.value = nodeTypeId
  } else if (!selectedTypeId.value && store.nodeTypes.length > 0) {
    selectedTypeId.value = store.nodeTypes[0].nodeTypeId
  }
}
function closeTypesDrawer() {
  typesDrawerOpen.value = false
}
</script>

<template>
  <div
    class="relative flex h-full flex-col"
    :class="isResizing ? 'select-none' : ''"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <h1 class="text-base font-medium text-text-1">Nodes</h1>
      <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-xs text-text-3">
        {{ filteredNodes.length }}
        <span
          v-if="filteredNodes.length !== store.nodes.length"
          class="text-text-4"
        >
          of {{ store.nodes.length }}
        </span>
      </span>

      <button
        class="ml-auto flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-colors"
        :class="
          typesDrawerOpen
            ? 'border-accent/20 bg-accent/10 text-accent-text'
            : 'border-border-1 text-text-3 hover:bg-bg-2 hover:text-text-2'
        "
        @click="openTypesDrawer"
      >
        <IconCategory
          :size="13"
          :stroke-width="1.5"
        />
        Node Types
        <span class="font-mono text-[10px] text-text-4">{{ store.nodeTypes.length }}</span>
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
        <span class="text-sm">Loading nodes...</span>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-sm text-error">{{ store.error }}</p>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
        <div
          class="flex items-center gap-2 rounded border border-border-1 bg-bg-1 px-2.5 py-1.5"
          style="min-width: 300px"
        >
          <IconSearch
            :size="13"
            :stroke-width="1.5"
            class="shrink-0 text-text-4"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Search nodes, annotations..."
            class="w-full bg-transparent font-mono text-xs text-text-2 placeholder:text-text-4 outline-none"
          />
        </div>

        <div class="h-4 w-px shrink-0 bg-bg-3" />
        <span class="text-[11px] text-text-4">Type</span>
        <button
          v-for="type in allTypes"
          :key="type"
          class="rounded border px-2 py-1 font-mono text-[11px] transition-colors"
          :class="
            activeTypes.has(type)
              ? nodeColor(type) + ' border-transparent'
              : 'border-transparent text-text-4 hover:bg-bg-2 hover:text-text-3'
          "
          @click="toggleType(type)"
        >
          {{ type }}
        </button>

        <button
          v-if="hasActiveFilters"
          class="ml-auto flex items-center gap-1 text-[11px] text-text-4 hover:text-text-2"
          @click="clearFilters"
        >
          Clear
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredNodes.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleOff
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-text-4"
          />
          <p class="mt-3 text-sm text-text-2">No nodes</p>
          <p class="mt-1 text-xs text-text-4">
            {{ hasActiveFilters ? 'No results for current filters' : 'No nodes discovered yet' }}
          </p>
        </div>
      </div>

      <!-- List-Detail -->
      <div
        v-else
        class="flex flex-1 overflow-hidden"
      >
        <!-- List -->
        <div
          class="shrink-0 overflow-y-auto"
          :style="{ width: listWidth + 'px' }"
        >
          <div
            v-for="node in filteredNodes"
            :key="node.nodeId"
            class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
            :class="
              node.nodeId === selectedId
                ? 'border-l-accent bg-accent/5'
                : 'border-l-transparent hover:bg-bg-1'
            "
            @click="selectedId = node.nodeId"
          >
            <div class="text-sm font-medium text-text-1">{{ node.displayName }}</div>
            <div class="mt-2 flex items-center gap-1.5">
              <span
                class="rounded px-1.5 py-0.5 font-mono text-[11px]"
                :class="nodeColor(store.getTypeName(node))"
              >
                {{ store.getTypeName(node) }}
              </span>
              <span
                v-if="nodeVersion(node.annotations)"
                class="font-mono text-[11px] text-text-4"
              >
                {{ nodeVersion(node.annotations) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Resize handle -->
        <div
          class="w-0.5 shrink-0 cursor-col-resize transition-colors hover:bg-accent/40"
          :class="isResizing ? 'bg-accent/60' : 'bg-bg-3'"
          @mousedown.prevent="onResizeStart"
        />

        <!-- Detail -->
        <div
          v-if="selectedNode"
          class="flex-1 overflow-y-auto"
        >
          <div class="border-b border-border-1 px-6 py-4">
            <div class="flex items-start justify-between gap-4">
              <h2 class="text-base font-medium text-text-1">{{ selectedNode.displayName }}</h2>
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-xs text-text-4">{{ selectedNode.nodeId }}</span>
                <CopyButton
                  :value="selectedNode.nodeId"
                  :size="13"
                />
              </div>
            </div>
            <div class="mt-2">
              <span
                class="rounded px-2 py-0.5 font-mono text-xs"
                :class="nodeColor(store.getTypeName(selectedNode))"
              >
                {{ store.getTypeName(selectedNode) }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-5 px-6 py-5">
            <!-- annotations -->
            <div v-if="Object.keys(selectedNode.annotations).length > 0">
              <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
                Annotations
              </div>
              <div
                v-for="(value, key) in selectedNode.annotations"
                :key="key"
                class="grid gap-4 border-b border-border-1 py-1.5 last:border-b-0 text-sm"
                style="grid-template-columns: minmax(200px, 35%) minmax(0, 1fr)"
              >
                <span
                  class="truncate font-mono text-text-3"
                  :title="key"
                >
                  {{ key }}
                </span>
                <span class="break-all font-mono text-text-2">{{ value }}</span>
              </div>
            </div>

            <!-- Node type -->
            <div v-if="store.getTypeForNode(selectedNode)">
              <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
                Node type
              </div>
              <div class="rounded border border-border-1 bg-bg-1 px-4 py-3">
                <div class="font-mono text-sm font-medium text-text-1">
                  {{ store.getTypeForNode(selectedNode)?.displayName }}
                </div>
                <div
                  v-if="store.getTypeForNode(selectedNode)?.description"
                  class="mt-1.5 font-mono text-xs leading-relaxed text-text-3"
                >
                  {{ store.getTypeForNode(selectedNode)?.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex flex-1 items-center justify-center"
        >
          <span class="font-mono text-xs text-text-4">Select a node to inspect</span>
        </div>
      </div>
    </template>

    <!-- node types drawer -->
    <SlideOverDrawer
      :open="typesDrawerOpen"
      title="Node Types"
      :count="store.nodeTypes.length"
      @close="closeTypesDrawer"
    >
      <template #icon>
        <IconCategory
          :size="16"
          :stroke-width="1.5"
          class="text-text-3"
        />
      </template>

      <!-- Type lits -->
      <div class="w-52 shrink-0 overflow-y-auto border-r border-border-1">
        <div
          v-for="type in store.nodeTypes"
          :key="type.nodeTypeId"
          class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-2.5 transition-colors"
          :class="
            type.nodeTypeId === selectedTypeId
              ? 'border-l-accent bg-accent/5'
              : 'border-l-transparent hover:bg-bg-1'
          "
          @click="selectedTypeId = type.nodeTypeId"
        >
          <span
            class="rounded px-1.5 py-0.5 font-mono text-[11px]"
            :class="nodeColor(type.displayName)"
          >
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
          <span
            class="rounded px-2 py-0.5 font-mono text-xs"
            :class="nodeColor(selectedType.displayName)"
          >
            {{ selectedType.displayName }}
          </span>
          <span class="font-mono text-xs text-text-4">{{ selectedType.nodeTypeId }}</span>
          <CopyButton
            :value="selectedType.nodeTypeId"
            :size="13"
          />
        </div>

        <p
          v-if="selectedType.description"
          class="mt-4 font-mono text-sm leading-relaxed text-text-2"
        >
          {{ selectedType.description }}
        </p>

        <div
          v-if="Object.keys(selectedType.annotations).length > 0"
          class="mt-6"
        >
          <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
            Annotations
          </div>
          <div
            v-for="(value, key) in selectedType.annotations"
            :key="key"
            class="grid gap-4 border-b border-border-1 py-1.5 last:border-b-0 text-sm"
            style="grid-template-columns: minmax(180px, 30%) minmax(0, 1fr)"
          >
            <span
              class="truncate font-mono text-text-3"
              :title="key"
            >
              {{ key }}
            </span>
            <span class="break-all font-mono text-text-2">{{ value }}</span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-1 items-center justify-center"
      >
        <span class="font-mono text-xs text-text-4">Select a node type</span>
      </div>
    </SlideOverDrawer>
  </div>
</template>
