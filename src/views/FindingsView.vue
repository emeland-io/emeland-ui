<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { IconCircleCheck, IconLoader2, IconListDetails } from '@tabler/icons-vue'
import { useFindingsStore } from '@/stores/findings'
import FindingsToolbar from '@/components/findings/FindingsToolbar.vue'
import FindingsList from '@/components/findings/FindingsList.vue'
import FindingDetail from '@/components/findings/FindingDetail.vue'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import { Annotation, getAnnotation } from '@/constants/annotations'
import { useResourceNav, useSelectQuery } from '@/composables/useResourceNav'

const store = useFindingsStore()
const { goToResource } = useResourceNav()

const search = ref('')
const activeTypes = ref<Set<string>>(new Set())
const activeResourceTypes = ref<Set<string>>(new Set())

const allTypes = computed(() => [...new Set(store.findings.map((f) => store.getKindForFinding(f)))])
const allResourceTypes = computed(() => [
  ...new Set(store.findings.flatMap((f) => f.resources.map((r) => r.resourceType))),
])

const filteredFindings = computed(() =>
  store.findings
    .filter((f) => {
      const q = search.value.toLowerCase()
      if (q) {
        const inSummary = f.summary.toLowerCase().includes(q)
        const inDescription = (f.description ?? '').toLowerCase().includes(q)
        const inAnnotations = Object.entries(f.annotations).some(
          ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
        )
        if (!inSummary && !inDescription && !inAnnotations) return false
      }
      if (activeTypes.value.size > 0 && !activeTypes.value.has(store.getKindForFinding(f)))
        return false
      if (
        activeResourceTypes.value.size > 0 &&
        !f.resources.some((r) => activeResourceTypes.value.has(r.resourceType))
      )
        return false
      return true
    })
    .sort((a, b) => {
      const tsA = getAnnotation(a.annotations, Annotation.DETECTED_AT) ?? ''
      const tsB = getAnnotation(b.annotations, Annotation.DETECTED_AT) ?? ''
      return tsB.localeCompare(tsA)
    }),
)

function toggleType(kind: string) {
  const s = new Set(activeTypes.value)
  if (s.has(kind)) {
    s.delete(kind)
  } else {
    s.add(kind)
  }
  activeTypes.value = s
}
function toggleResourceType(rt: string) {
  const s = new Set(activeResourceTypes.value)
  if (s.has(rt)) {
    s.delete(rt)
  } else {
    s.add(rt)
  }
  activeResourceTypes.value = s
}
function clearFilters() {
  search.value = ''
  activeTypes.value = new Set()
  activeResourceTypes.value = new Set()
}

const selectedId = ref('')
const selectedFinding = computed(() => store.findings.find((f) => f.findingId === selectedId.value))

// Preselect a finding when arriving via ?select=<id> (e.g. from a node).
useSelectQuery(
  selectedId,
  computed(() => store.findings),
  (f) => f.findingId,
)

watch(
  filteredFindings,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((f) => f.findingId === selectedId.value)) {
      selectedId.value = list[0].findingId
    }
  },
  { immediate: true },
)

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

// Finding Types drawer
const typesDrawerOpen = ref(false)
const selectedTypeId = ref('')
const selectedType = computed(() =>
  store.findingTypes.find((t) => t.findingTypeId === selectedTypeId.value),
)
function kindOfType(typeId: string): string {
  const t = store.findingTypes.find((ft) => ft.findingTypeId === typeId)
  return t ? (getAnnotation(t.annotations, Annotation.FINDING_KIND) ?? 'Unknown') : 'Unknown'
}
function openTypesDrawer() {
  typesDrawerOpen.value = true
  const typeId = selectedFinding.value?.type
  if (typeId && store.findingTypes.some((t) => t.findingTypeId === typeId)) {
    selectedTypeId.value = typeId
  } else if (!selectedTypeId.value && store.findingTypes.length > 0) {
    selectedTypeId.value = store.findingTypes[0].findingTypeId
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
      <h1 class="text-base font-medium text-text-1">Findings</h1>
      <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-xs text-text-3">
        {{ filteredFindings.length }}
        <span
          v-if="filteredFindings.length !== store.findings.length"
          class="text-text-4"
        >
          of {{ store.findings.length }}
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
        <IconListDetails
          :size="13"
          :stroke-width="1.5"
        />
        Finding Types
        <span class="font-mono text-[10px] text-text-4">{{ store.findingTypes.length }}</span>
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
        <span class="text-sm">Loading findings...</span>
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
      <FindingsToolbar
        :search="search"
        :types="allTypes"
        :resource-types="allResourceTypes"
        :active-types="activeTypes"
        :active-resource-types="activeResourceTypes"
        @update:search="search = $event"
        @toggle-type="toggleType"
        @toggle-resource-type="toggleResourceType"
        @clear="clearFilters"
      />
      <!-- Empty state -->
      <div
        v-if="filteredFindings.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleCheck
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-accent"
          />
          <p class="mt-3 text-sm text-text-2">No findings</p>
          <p class="mt-1 text-xs text-text-4">All rules passed or no results for current filters</p>
        </div>
      </div>
      <!-- Master-Detail -->
      <div
        v-else
        class="flex flex-1 overflow-hidden"
      >
        <div
          class="shrink-0"
          :style="{ width: listWidth + 'px' }"
        >
          <FindingsList
            :findings="filteredFindings"
            :selected-id="selectedId"
            :kind-for="store.getKindForFinding"
            @select="selectedId = $event"
          />
        </div>
        <!-- Resize handle -->
        <div
          class="w-0.5 shrink-0 cursor-col-resize transition-colors hover:bg-accent/40"
          :class="isResizing ? 'bg-accent/60' : 'bg-bg-3'"
          @mousedown.prevent="onResizeStart"
        />
        <FindingDetail
          v-if="selectedFinding"
          class="flex-1"
          :finding="selectedFinding"
          :kind="store.getKindForFinding(selectedFinding)"
          :type="store.getTypeForFinding(selectedFinding)"
          @navigate-resource="goToResource"
        />
        <div
          v-else
          class="flex flex-1 items-center justify-center"
        >
          <span class="font-mono text-xs text-text-4">Select a finding to inspect</span>
        </div>
      </div>
    </template>
    <!-- Finding Types slide-over drawer -->
    <SlideOverDrawer
      :open="typesDrawerOpen"
      title="Finding Types"
      :count="store.findingTypes.length"
      @close="closeTypesDrawer"
    >
      <template #icon>
        <IconListDetails
          :size="16"
          :stroke-width="1.5"
          class="text-text-3"
        />
      </template>
      <!-- Type list -->
      <div class="w-56 shrink-0 overflow-y-auto border-r border-border-1">
        <div
          v-for="type in store.findingTypes"
          :key="type.findingTypeId"
          class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-2.5 transition-colors"
          :class="
            type.findingTypeId === selectedTypeId
              ? 'border-l-accent bg-accent/5'
              : 'border-l-transparent hover:bg-bg-1'
          "
          @click="selectedTypeId = type.findingTypeId"
        >
          <div class="text-sm font-medium text-text-1">{{ type.displayName }}</div>
          <span
            class="mt-1 inline-block rounded bg-sensor/10 px-1.5 py-0.5 font-mono text-[10px] text-sensor"
          >
            {{ kindOfType(type.findingTypeId) }}
          </span>
        </div>
      </div>
      <!-- Type detail -->
      <div
        v-if="selectedType"
        class="flex-1 overflow-y-auto px-6 py-5"
      >
        <h3 class="text-base font-medium text-text-1">{{ selectedType.displayName }}</h3>
        <div class="mt-2 flex items-center gap-2">
          <span class="rounded bg-sensor/10 px-2 py-0.5 font-mono text-xs text-sensor">
            {{ kindOfType(selectedType.findingTypeId) }}
          </span>
          <span class="font-mono text-xs text-text-4">{{ selectedType.findingTypeId }}</span>
          <CopyButton
            :value="selectedType.findingTypeId"
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
        <span class="font-mono text-xs text-text-4">Select a finding type</span>
      </div>
    </SlideOverDrawer>
  </div>
</template>
