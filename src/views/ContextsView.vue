<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  IconSearch,
  IconCircleOff,
  IconLoader2,
  IconCategory,
  IconArrowUpRight,
  IconAlertTriangle,
  IconList,
  IconHierarchy,
  IconChevronRight,
  IconArrowDown,
  IconArrowUp,
} from '@tabler/icons-vue'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import { useResourceNav, useSelectQuery } from '@/composables/useResourceNav'

const store = useContextStore()
const findingsStore = useFindingsStore()
const { goToFinding } = useResourceNav()

const search = ref('')
const activeTypes = ref<Set<string>>(new Set())
const allTypes = computed(() => [...new Set(store.contexts.map((c) => store.getTypeName(c)))])
const filteredContexts = computed(() =>
  store.contexts.filter((c) => {
    const q = search.value.toLowerCase()
    if (q) {
      const inName = c.displayName.toLowerCase().includes(q)
      const inDesc = (c.description ?? '').toLowerCase().includes(q)
      const inAnnotations = Object.entries(c.annotations).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
      )
      if (!inName && !inDesc && !inAnnotations) return false
    }
    if (activeTypes.value.size > 0 && !activeTypes.value.has(store.getTypeName(c))) return false
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

function isTypeUnknown(c: (typeof store.contexts)[number]): boolean {
  return store.getTypeName(c) === 'Unknown'
}

const viewMode = ref<'list' | 'tree'>('tree')

interface TreeRow {
  context: (typeof store.contexts)[number]
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
  const present = new Set(filteredContexts.value.map((c) => c.contextId))
  const ids = new Set<string>()
  for (const c of filteredContexts.value) {
    if (c.parentId && present.has(c.parentId)) ids.add(c.parentId)
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
  const present = new Set(filteredContexts.value.map((c) => c.contextId))
  const childrenOf = new Map<string, typeof filteredContexts.value>()
  const roots: typeof filteredContexts.value = []
  for (const c of filteredContexts.value) {
    if (c.parentId && present.has(c.parentId)) {
      const list = childrenOf.get(c.parentId) ?? []
      list.push(c)
      childrenOf.set(c.parentId, list)
    } else {
      roots.push(c)
    }
  }
  const rows: TreeRow[] = []
  const walk = (c: (typeof store.contexts)[number], depth: number) => {
    const kids = childrenOf.get(c.contextId) ?? []
    rows.push({ context: c, depth, hasChildren: kids.length > 0 })
    // Skip the subtree of a collapsed node.
    if (collapsed.value.has(c.contextId)) return
    for (const child of kids) walk(child, depth + 1)
  }
  for (const r of roots) walk(r, 0)
  return rows
})

// Selection
const selectedId = ref('')
const selectedContext = computed(() => store.contexts.find((c) => c.contextId === selectedId.value))
const selectedTypeUnknown = computed(() => {
  const c = selectedContext.value
  if (!c) return false
  return isTypeUnknown(c)
})

function selectContext(id: string) {
  selectedId.value = id
  if (id) {
    store.loadContextDetail(id)
  }
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

watch(selectedId, (id) => {
  if (id) store.loadContextDetail(id)
})

watch(
  () => selectedContext.value?.contextTypeId,
  (id) => {
    if (id) store.ensureContextType(id)
  },
  { immediate: true },
)

const relatedFindings = computed(() => {
  const id = selectedId.value
  if (!id) return []
  return findingsStore.findings.filter((f) => f.resources.some((r) => r.resourceId === id))
})

onMounted(async () => {
  findingsStore.load()
  await store.load()
  await Promise.all([store.loadAllDetails(), store.loadContextTypes()])
})

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
function goToParent(parentId: string) {
  selectContext(parentId)
}
</script>

<template>
  <div class="relative flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <h1 class="text-base font-medium text-text-1">Contexts</h1>
      <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-xs text-text-3">
        {{ filteredContexts.length }}
        <span
          v-if="filteredContexts.length !== store.contexts.length"
          class="text-text-4"
        >
          of {{ store.contexts.length }}
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
        Context Types
        <span
          v-if="store.typesLoaded"
          class="font-mono text-[10px] text-text-4"
        >
          {{ store.contextTypes.length }}
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
        <span class="text-sm">Loading contexts...</span>
      </div>
    </div>
    <!-- Error -->
    <div
      v-else-if="store.error && store.contexts.length === 0"
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
            placeholder="Search contexts, annotations..."
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
              ? 'border-accent/20 bg-accent/10 text-accent-text'
              : 'border-transparent text-text-4 hover:bg-bg-2 hover:text-text-3'
          "
          @click="toggleType(type)"
        >
          {{ type }}
        </button>
        <button
          v-if="hasActiveFilters"
          class="flex items-center gap-1 text-[11px] text-text-4 hover:text-text-2"
          @click="clearFilters"
        >
          Clear
        </button>
        <div class="ml-auto flex items-center gap-2">
          <!-- expand / collapse all (tree mode only) -->
          <button
            v-if="viewMode === 'tree' && expandableIds.size > 0"
            class="flex items-center gap-1.5 rounded border border-border-1 px-2 py-1 text-[11px] text-text-3 transition-colors hover:bg-bg-2 hover:text-text-2"
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
          <!-- view mode toggle: tree first, then list -->
          <div class="flex items-center gap-0.5 rounded border border-border-1 bg-bg-1 p-0.5">
            <button
              class="flex h-6 w-6 items-center justify-center rounded transition-colors"
              :class="viewMode === 'tree' ? 'bg-bg-3 text-text-1' : 'text-text-4 hover:text-text-2'"
              title="Hierarchy view"
              aria-label="Hierarchy view"
              @click="viewMode = 'tree'"
            >
              <IconHierarchy
                :size="13"
                :stroke-width="1.75"
              />
            </button>
            <button
              class="flex h-6 w-6 items-center justify-center rounded transition-colors"
              :class="viewMode === 'list' ? 'bg-bg-3 text-text-1' : 'text-text-4 hover:text-text-2'"
              title="List view"
              aria-label="List view"
              @click="viewMode = 'list'"
            >
              <IconList
                :size="13"
                :stroke-width="1.75"
              />
            </button>
          </div>
        </div>
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
          <p class="mt-3 text-sm text-text-2">No contexts</p>
          <p class="mt-1 text-xs text-text-4">
            {{ hasActiveFilters ? 'No results for current filters' : 'No contexts discovered yet' }}
          </p>
        </div>
      </div>
      <!-- List-Detail -->
      <ListDetail v-else>
        <!-- List -->
        <template #list>
          <!-- flat list -->
          <template v-if="viewMode === 'list'">
            <div
              v-for="ctx in filteredContexts"
              :key="ctx.contextId"
              class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
              :class="
                ctx.contextId === selectedId
                  ? 'border-l-accent bg-accent/5'
                  : 'border-l-transparent hover:bg-bg-1'
              "
              @click="selectContext(ctx.contextId)"
            >
              <div class="text-sm font-medium text-text-1">{{ ctx.displayName }}</div>
              <div class="mt-2 flex items-center gap-1.5">
                <span
                  class="rounded px-1.5 py-0.5 font-mono text-[11px]"
                  :class="
                    isTypeUnknown(ctx) ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'
                  "
                >
                  {{ store.getTypeName(ctx) }}
                </span>
                <span
                  v-if="store.getParentName(ctx)"
                  class="font-mono text-[11px] text-text-4"
                >
                  ↳ {{ store.getParentName(ctx) }}
                </span>
              </div>
            </div>
          </template>
          <!-- hierarchy tree -->
          <template v-else>
            <div
              v-for="row in treeRows"
              :key="row.context.contextId"
              class="flex cursor-pointer items-center gap-2 border-b border-border-1 border-l-2 py-2.5 pr-4 transition-colors"
              :class="
                row.context.contextId === selectedId
                  ? 'border-l-accent bg-accent/5'
                  : 'border-l-transparent hover:bg-bg-1'
              "
              :style="{ paddingLeft: `${16 + row.depth * 18}px` }"
              @click="selectContext(row.context.contextId)"
            >
              <!-- expand/collapse toggle (parents) or spacer (leaves) -->
              <button
                v-if="row.hasChildren"
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded text-text-4 hover:text-text-2"
                :aria-label="collapsed.has(row.context.contextId) ? 'Expand' : 'Collapse'"
                @click.stop="toggleCollapse(row.context.contextId)"
              >
                <IconChevronRight
                  :size="14"
                  :stroke-width="2"
                  class="transition-transform"
                  :class="{ 'rotate-90': !collapsed.has(row.context.contextId) }"
                />
              </button>
              <span
                v-else
                class="h-4 w-4 shrink-0"
              />
              <span class="truncate text-sm font-medium text-text-1">
                {{ row.context.displayName }}
              </span>
              <span
                class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
                :class="
                  isTypeUnknown(row.context) ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'
                "
              >
                {{ store.getTypeName(row.context) }}
              </span>
            </div>
          </template>
        </template>

        <!-- Detail -->
        <template #detail>
          <div
            v-if="selectedContext"
            class="flex-1 overflow-y-auto"
          >
            <div class="border-b border-border-1 px-6 py-4">
              <div class="flex items-start justify-between gap-4">
                <h2 class="text-base font-medium text-text-1">{{ selectedContext.displayName }}</h2>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-xs text-text-4">{{ selectedContext.contextId }}</span>
                  <CopyButton
                    :value="selectedContext.contextId"
                    :size="13"
                  />
                </div>
              </div>
              <div class="mt-2">
                <button
                  v-if="selectedContext.contextTypeId"
                  class="group inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs transition-opacity hover:opacity-80"
                  :class="
                    selectedTypeUnknown ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'
                  "
                  title="Show context type"
                  @click="openTypeInDrawer(selectedContext.contextTypeId)"
                >
                  {{ store.getTypeName(selectedContext) }}
                </button>
                <span
                  v-else
                  class="rounded bg-error/10 px-2 py-0.5 font-mono text-xs text-error"
                >
                  Unknown
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-5 px-6 py-5">
              <!-- detail load failed -->
              <div
                v-if="store.hasDetailError(selectedContext.contextId)"
                class="flex items-start gap-2 rounded border border-error/20 bg-error/5 px-3 py-2"
              >
                <IconAlertTriangle
                  :size="14"
                  :stroke-width="2"
                  class="mt-0.5 shrink-0 text-error"
                />
                <div class="min-w-0">
                  <div class="text-sm text-error">Could not load full details</div>
                  <div class="mt-0.5 font-mono text-[11px] text-error/80">
                    Showing basic info only — the detail request failed.
                  </div>
                </div>
              </div>
              <!-- description -->
              <p
                v-if="selectedContext.description"
                class="font-mono text-sm leading-relaxed text-text-2"
              >
                {{ selectedContext.description }}
              </p>
              <!-- Parent -->
              <div v-if="selectedContext.parentId">
                <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
                  Parent
                </div>
                <button
                  v-if="!store.isParentUnresolved(selectedContext)"
                  class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
                  title="Go to parent context"
                  @click="goToParent(selectedContext.parentId)"
                >
                  <span
                    class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-[11px] font-semibold uppercase text-accent"
                  >
                    Context
                  </span>
                  <span
                    class="max-w-full truncate text-sm text-text-2 transition-colors group-hover:text-accent"
                  >
                    {{ store.getParentName(selectedContext) }}
                  </span>
                  <IconArrowUpRight
                    :size="16"
                    :stroke-width="2"
                    class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
                  />
                  <!-- <span class="ml-auto shrink-0 font-mono text-[11px] text-text-4">
                    {{ selectedContext.parentId }}
                  </span> -->
                  <div class="ml-auto flex shrink-0 items-center gap-1.5">
                    <span class="font-mono text-[11px] text-text-4">
                      {{ selectedContext.parentId }}
                    </span>
                    <CopyButton
                      :value="selectedContext.parentId"
                      :size="12"
                      @click.stop
                    />
                  </div>
                </button>
                <!-- unresolved parent (ContextParentNotFound) -->
                <div
                  v-else
                  class="flex items-center gap-3 border-b border-border-1 py-2 last:border-b-0"
                >
                  <span
                    class="flex w-28 shrink-0 items-center justify-center gap-1 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-[11px] font-semibold uppercase text-error"
                  >
                    <IconAlertTriangle
                      :size="12"
                      :stroke-width="2"
                    />
                    Context
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm text-error">Unresolved parent</div>
                    <div class="mt-0.5 truncate font-mono text-[11px] text-error/80">
                      References a parent context that does not exist.
                    </div>
                  </div>
                  <span class="font-mono text-[11px] text-text-4">
                    {{ selectedContext.parentId }}
                  </span>
                </div>
              </div>
              <!-- annotations -->
              <div v-if="Object.keys(selectedContext.annotations).length > 0">
                <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
                  Annotations
                </div>
                <div
                  v-for="(value, key) in selectedContext.annotations"
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
              <!-- Related findings -->
              <div v-if="relatedFindings.length > 0">
                <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
                  Findings
                </div>
                <button
                  v-for="f in relatedFindings"
                  :key="f.findingId"
                  class="group flex w-full items-center gap-2.5 border-b border-border-1 py-2 text-left last:border-b-0"
                  title="Go to finding"
                  @click="goToFinding(f.findingId)"
                >
                  <span
                    class="shrink-0 rounded bg-sensor/10 px-1.5 py-0.5 font-mono text-[10px] text-sensor"
                  >
                    {{ findingsStore.getKindForFinding(f) }}
                  </span>
                  <span
                    class="max-w-full truncate text-sm text-text-2 transition-colors group-hover:text-accent"
                  >
                    {{ f.displayName }}
                  </span>
                  <IconArrowUpRight
                    :size="15"
                    :stroke-width="2"
                    class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
                  />
                  <span class="ml-auto shrink-0 font-mono text-[11px] text-text-4">
                    {{ f.findingId }}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div
            v-else
            class="flex flex-1 items-center justify-center"
          >
            <span class="font-mono text-xs text-text-4">Select a context to inspect</span>
          </div>
        </template>
      </ListDetail>
    </template>

    <!-- context types drawer -->
    <SlideOverDrawer
      :open="typesDrawerOpen"
      title="Context Types"
      :count="store.typesLoaded ? store.contextTypes.length : undefined"
      @close="closeTypesDrawer"
    >
      <template #icon>
        <IconCategory
          :size="16"
          :stroke-width="1.5"
          class="text-text-3"
        />
      </template>
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
          <span class="text-sm">Loading types...</span>
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
            <span class="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent">
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
            <span class="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
              {{ selectedType.displayName }}
            </span>
            <span class="font-mono text-xs text-text-4">{{ selectedType.contextTypeId }}</span>
            <CopyButton
              :value="selectedType.contextTypeId"
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
          <span class="font-mono text-xs text-text-4">Select a context type</span>
        </div>
      </template>
    </SlideOverDrawer>
  </div>
</template>
