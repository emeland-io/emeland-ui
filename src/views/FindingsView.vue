<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { IconCircleCheck, IconLoader2 } from '@tabler/icons-vue'
import { useFindingsStore } from '@/stores/findings'
import FindingsToolbar from '@/components/findings/FindingsToolbar.vue'
import FindingsList from '@/components/findings/FindingsList.vue'
import FindingDetail from '@/components/findings/FindingDetail.vue'
import { Annotation, getAnnotation } from '@/constants/annotations'

const store = useFindingsStore()

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
</script>

<template>
  <div
    class="flex h-full flex-col"
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
        />
        <div
          v-else
          class="flex flex-1 items-center justify-center"
        >
          <span class="font-mono text-xs text-text-4">Select a finding to inspect</span>
        </div>
      </div>
    </template>
  </div>
</template>
