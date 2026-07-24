<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  IconSearch,
  IconCircleOff,
  IconLoader2,
  IconCategory,
  IconArrowUpRight,
} from '@tabler/icons-vue'
import { useNodesStore } from '@/stores/nodes'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import { useResourceNav, useSelectQuery } from '@/composables/useResourceNav'
import { categoryColorForNode, categoryColorForName } from '@/constants/nodeCategory'

const store = useNodesStore()
const findingsStore = useFindingsStore()
const { goToFinding } = useResourceNav()

function nodeVersion(annotations: Record<string, string>): string | undefined {
  const entry = Object.entries(annotations).find(([k]) => k.endsWith('/version') || k === 'version')
  return entry?.[1]
}

const search = ref('')
const activeTypes = ref<Set<string>>(new Set())
const allTypes = computed(() => [...new Set(store.nodes.map((n) => store.getTypeName(n)))])
const filteredNodes = computed(() =>
  store.nodes.filter((n) => {
    const q = search.value.toLowerCase()
    if (q) {
      const inName = n.displayName.toLowerCase().includes(q)
      const inId = n.nodeId.toLocaleLowerCase().includes(q)
      const inTypeId = (n.nodeType?.nodeTypeId ?? '').toLocaleLowerCase().includes(q)
      const inAnnotations = Object.entries(n.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
      if (!inName && !inId && !inTypeId && !inAnnotations) return false
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

const selectedNodeTypeUnknown = computed(() => {
  const n = selectedNode.value
  if (!n) return false
  const cat = store.getTypeCategory(n)
  return !cat || cat === 'Unknown'
})

function selectNode(id: string) {
  selectedId.value = id
  if (id) store.loadNodeDetail(id)
}

// Preselect a node when arriving via ?select=<id>
useSelectQuery(
  selectedId,
  computed(() => store.nodes),
  (n) => n.nodeId,
)

watch(
  filteredNodes,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((n) => n.nodeId === selectedId.value)) {
      selectNode(list[0].nodeId)
    }
  },
  { immediate: true },
)

watch(selectedId, (id) => {
  if (id) store.loadNodeDetail(id)
})

const relatedFindings = computed(() => {
  const id = selectedId.value
  if (!id) return []
  return findingsStore.findings.filter((f) => f.resources.some((r) => r.resourceId === id))
})

onMounted(() => {
  store.load()
  findingsStore.load()
})

// Node Types drawer
const typesDrawerOpen = ref(false)
const selectedTypeId = ref('')
const selectedType = computed(() => {
  const detail = store.selectedTypeDetail
  if (detail && detail.nodeTypeId === selectedTypeId.value) return detail
  return store.nodeTypes.find((t) => t.nodeTypeId === selectedTypeId.value)
})
async function openTypesDrawer() {
  typesDrawerOpen.value = true
  await store.loadNodeTypes()
  const nodeTypeId = selectedNode.value?.nodeType?.nodeTypeId
  if (nodeTypeId && store.nodeTypes.some((t) => t.nodeTypeId === nodeTypeId)) {
    selectTypeInDrawer(nodeTypeId)
  } else if (!selectedTypeId.value && store.nodeTypes.length > 0) {
    selectTypeInDrawer(store.nodeTypes[0].nodeTypeId)
  }
}

function selectTypeInDrawer(id: string) {
  selectedTypeId.value = id
  if (id) store.loadNodeTypeDetail(id)
}

async function openTypeInDrawer(nodeTypeId: string) {
  typesDrawerOpen.value = true
  await store.loadNodeTypes()
  if (store.nodeTypes.some((t) => t.nodeTypeId === nodeTypeId)) {
    selectTypeInDrawer(nodeTypeId)
  }
}
function closeTypesDrawer() {
  typesDrawerOpen.value = false
}
</script>

<template>
  <div class="relative flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <div class="flex min-w-44 items-center gap-3">
        <h1 class="text-title font-medium text-text-1">Nodes</h1>
        <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3">
          {{ filteredNodes.length }}
          <span
            v-if="filteredNodes.length !== store.nodes.length"
            class="text-text-4"
          >
            of {{ store.nodes.length }}
          </span>
        </span>
      </div>
      <button
        class="ml-auto flex items-center gap-1.5 rounded border px-2.5 py-1 text-label transition-colors"
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
        <span
          v-if="store.typesLoaded"
          class="font-mono text-micro text-text-4"
        >
          {{ store.nodeTypes.length }}
        </span>
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
        <span class="text-body">Loading nodes...</span>
      </div>
    </div>
    <!-- Error -->
    <div
      v-else-if="store.error && store.nodes.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-body text-error">{{ store.error }}</p>
    </div>
    <template v-else>
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
        <div
          class="flex items-center gap-2 rounded bg-bg-2 px-2.5 py-1.5 transition-shadow focus-within:ring-1 focus-within:ring-border-2"
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
            class="w-full bg-transparent font-mono text-label text-text-2 placeholder:text-meta placeholder:text-text-4 outline-none"
          />
        </div>
        <div class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1">
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
        v-if="filteredNodes.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleOff
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-text-4"
          />
          <p class="mt-3 text-body text-text-2">No nodes</p>
          <p class="mt-1 text-label text-text-4">
            {{ hasActiveFilters ? 'No results for current filters' : 'No nodes discovered yet' }}
          </p>
        </div>
      </div>
      <!-- List-Detail -->
      <ListDetail v-else>
        <!-- List -->
        <template #list>
          <div
            v-for="node in filteredNodes"
            :key="node.nodeId"
            class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
            :class="
              node.nodeId === selectedId
                ? 'border-l-accent bg-accent/5'
                : 'border-l-transparent hover:bg-bg-1'
            "
            @click="selectNode(node.nodeId)"
          >
            <div class="text-body font-medium text-text-1">{{ node.displayName }}</div>
            <div class="mt-2 flex items-center gap-1.5">
              <span
                class="rounded px-1.5 py-0.5 font-mono text-meta"
                :class="categoryColorForNode(node)"
              >
                {{ store.getTypeName(node) }}
              </span>
              <span
                v-if="nodeVersion(node.annotations)"
                class="font-mono text-meta text-text-id"
              >
                {{ nodeVersion(node.annotations) }}
              </span>
            </div>
          </div>
        </template>

        <!-- Detail -->
        <template #detail>
          <div
            v-if="selectedNode"
            class="flex-1 overflow-y-auto"
          >
            <div class="border-b border-border-1 px-6 py-4">
              <div class="flex items-start justify-between gap-4">
                <h2 class="text-title font-medium text-text-1">{{ selectedNode.displayName }}</h2>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-label text-text-id">{{ selectedNode.nodeId }}</span>
                  <CopyButton
                    :value="selectedNode.nodeId"
                    :size="13"
                  />
                </div>
              </div>
              <div class="mt-2">
                <button
                  v-if="selectedNode.nodeType?.nodeTypeId"
                  class="group inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-label transition-opacity hover:opacity-80"
                  :class="categoryColorForNode(selectedNode)"
                  title="Show node type"
                  @click="openTypeInDrawer(selectedNode.nodeType.nodeTypeId)"
                >
                  {{ store.getTypeName(selectedNode) }}
                </button>
                <span
                  v-else
                  class="rounded px-2 py-0.5 font-mono text-label"
                  :class="categoryColorForNode(selectedNode)"
                >
                  {{ store.getTypeName(selectedNode) }}
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-5 px-6 py-5">
              <!-- detail load failed -->
              <div
                v-if="store.hasDetailError(selectedNode.nodeId)"
                class="flex items-start gap-2 rounded border border-error/20 bg-error/5 px-3 py-2"
              >
                <div class="min-w-0">
                  <div class="text-body text-error">Could not load full details</div>
                  <div class="mt-0.5 font-mono text-meta text-error/80">
                    Showing basic info only — the detail request failed.
                  </div>
                </div>
              </div>
              <!-- annotations -->
              <div v-if="Object.keys(selectedNode.annotations).length > 0">
                <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
                  Annotations
                </div>
                <div
                  v-for="(value, key) in selectedNode.annotations"
                  :key="key"
                  class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
                  style="grid-template-columns: minmax(200px, 35%) minmax(0, 1fr)"
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
              <!-- Related findings -->
              <div v-if="relatedFindings.length > 0">
                <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
                  Findings
                </div>
                <button
                  v-for="f in relatedFindings"
                  :key="f.findingId"
                  class="group flex w-full items-center gap-2.5 border-b border-border-1 py-2 text-left last:border-b-0"
                  :title="`Go to finding`"
                  @click="goToFinding(f.findingId)"
                >
                  <span
                    class="shrink-0 rounded bg-sensor/10 px-1.5 py-0.5 font-mono text-micro text-sensor"
                  >
                    {{ findingsStore.getKindForFinding(f) }}
                  </span>
                  <span
                    class="max-w-full truncate text-body text-text-2 transition-colors group-hover:text-accent"
                  >
                    {{ f.displayName }}
                  </span>
                  <IconArrowUpRight
                    :size="15"
                    :stroke-width="2"
                    class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
                  />
                  <span class="ml-auto shrink-0 font-mono text-meta text-text-id">
                    {{ f.findingId }}
                  </span>
                </button>
              </div>
              <!-- Node type -->
              <div>
                <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
                  Node type
                </div>
                <div class="flex items-center gap-3 border-b border-border-1 py-2 last:border-b-0">
                  <span
                    class="flex w-28 shrink-0 items-center justify-center gap-1 rounded px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase"
                    :class="
                      selectedNodeTypeUnknown
                        ? 'bg-error/10 text-error'
                        : 'bg-accent/10 text-accent'
                    "
                  >
                    <IconAlertTriangle
                      v-if="selectedNodeTypeUnknown"
                      :size="12"
                      :stroke-width="2"
                    />
                    NodeType
                  </span>
                  <!-- name (description as secondary line if present) -->
                  <div class="min-w-0 flex-1">
                    <div
                      class="truncate text-body"
                      :class="selectedNodeTypeUnknown ? 'text-error' : 'text-text-2'"
                    >
                      {{ selectedNode.nodeType?.displayName || 'Unknown' }}
                    </div>
                    <div
                      v-if="selectedNodeTypeUnknown"
                      class="mt-0.5 truncate font-mono text-meta text-error/80"
                    >
                      References a node type that does not exist.
                    </div>
                    <div
                      v-else-if="store.getTypeForNode(selectedNode)?.description"
                      class="mt-0.5 truncate font-mono text-meta text-text-id"
                    >
                      {{ store.getTypeForNode(selectedNode)?.description }}
                    </div>
                  </div>
                  <!-- id + copy (only when a type id exists) -->
                  <div
                    v-if="selectedNode.nodeType?.nodeTypeId"
                    class="flex items-center gap-1.5 shrink-0"
                  >
                    <span class="font-mono text-meta text-text-id">
                      {{ selectedNode.nodeType.nodeTypeId }}
                    </span>
                    <CopyButton
                      :value="selectedNode.nodeType.nodeTypeId"
                      :size="12"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="flex flex-1 items-center justify-center"
          >
            <span class="font-mono text-label text-text-id">Select a node to inspect</span>
          </div>
        </template>
      </ListDetail>
    </template>
    <!-- node types drawer -->
    <SlideOverDrawer
      :open="typesDrawerOpen"
      title="Node Types"
      :count="store.typesLoaded ? store.nodeTypes.length : undefined"
      @close="closeTypesDrawer"
    >
      <template #icon>
        <IconCategory
          :size="16"
          :stroke-width="1.5"
          class="text-text-3"
        />
      </template>
      <!-- Loading -->
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
            v-for="type in store.nodeTypes"
            :key="type.nodeTypeId"
            class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-2.5 transition-colors"
            :class="
              type.nodeTypeId === selectedTypeId
                ? 'border-l-accent bg-accent/5'
                : 'border-l-transparent hover:bg-bg-1'
            "
            @click="selectTypeInDrawer(type.nodeTypeId)"
          >
            <span
              class="rounded px-1.5 py-0.5 font-mono text-meta"
              :class="categoryColorForName(type.displayName)"
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
              class="rounded px-2 py-0.5 font-mono text-label"
              :class="categoryColorForName(selectedType.displayName)"
            >
              {{ selectedType.displayName }}
            </span>
            <span class="font-mono text-label text-text-id">{{ selectedType.nodeTypeId }}</span>
            <CopyButton
              :value="selectedType.nodeTypeId"
              :size="13"
            />
          </div>
          <p
            v-if="selectedType.description"
            class="mt-4 font-mono text-body leading-relaxed text-text-2"
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
          <span class="font-mono text-label text-text-id">Select a node type</span>
        </div>
      </template>
    </SlideOverDrawer>
  </div>
</template>
