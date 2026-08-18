<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useFindingsStore } from '@/stores/findings'
import FindingsToolbar from '@/components/findings/FindingsToolbar.vue'
import FindingsList from '@/components/findings/FindingsList.vue'
import FindingDetail from '@/components/findings/FindingDetail.vue'
import ListDetail from '@/components/ListDetail.vue'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import LoadingState from '@/components/view/LoadingState.vue'
import ErrorState from '@/components/view/ErrorState.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useResourceNav, useSelectQuery } from '@/composables/useResourceNav'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useAutoSelectFirst } from '@/composables/useResourceList'
import { useTypesDrawer } from '@/composables/useTypesDrawer'
import { toggledSet } from '@/utils/set'
import { matchesQuery } from '@/utils/search'

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
  store.findings.filter((f) => {
    if (!matchesQuery(search.value, f.displayName, f.description)) return false
    if (activeTypes.value.size > 0 && !activeTypes.value.has(store.getKindForFinding(f)))
      return false
    if (
      activeResourceTypes.value.size > 0 &&
      !f.resources.some((r) => activeResourceTypes.value.has(r.resourceType))
    )
      return false
    return true
  }),
)

function toggleType(kind: string) {
  activeTypes.value = toggledSet(activeTypes.value, kind)
}
function toggleResourceType(rt: string) {
  activeResourceTypes.value = toggledSet(activeResourceTypes.value, rt)
}
function clearFilters() {
  search.value = ''
  activeTypes.value = new Set()
  activeResourceTypes.value = new Set()
}

const selectedId = ref('')
const selectedFinding = computed(() => store.findings.find((f) => f.findingId === selectedId.value))

// Preselect a finding when arriving via ?select=<id> (e.g. from a node).
function selectFinding(id: string) {
  selectedId.value = id
  if (id) store.loadFindingDetail(id)
}

useSelectQuery(
  selectedId,
  computed(() => store.findings),
  (f) => f.findingId,
)

useAutoSelectFirst(filteredFindings, (f) => f.findingId, selectedId, selectFinding)

watch(selectedId, (id) => {
  if (id) store.loadFindingDetail(id)
})

onMounted(() => store.load())

// Finding Types drawer
const typesDrawer = useTypesDrawer({
  types: () => store.findingTypes,
  idOf: (t) => t.findingTypeId,
  detail: () => store.selectedTypeDetail,
  load: store.loadFindingTypes,
  loadDetail: store.loadFindingTypeDetail,
  currentTypeId: () => selectedFinding.value?.findingType?.findingTypeId,
})
const { open: typesDrawerOpen, selectedTypeId, selectedType } = typesDrawer

useListKeyboardNav(
  computed(() => filteredFindings.value.map((f) => f.findingId)),
  selectedId,
  selectFinding,
  typesDrawerOpen,
)
</script>

<template>
  <div class="relative flex h-full flex-col">
    <ViewHeader
      title="Findings"
      :count="store.findings.length"
    >
      <template #actions>
        <button
          class="ml-auto flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1 text-meta transition-colors"
          :class="
            typesDrawerOpen
              ? 'bg-accent/10 text-accent-text'
              : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
          "
          @click="typesDrawer.openDrawer()"
        >
          Finding types
          <span
            v-if="store.typesLoaded"
            class="font-mono text-micro text-text-4"
          >
            {{ store.findingTypes.length }}
          </span>
        </button>
      </template>
    </ViewHeader>
    <LoadingState
      v-if="store.loading"
      label="Loading findings..."
    />
    <ErrorState
      v-else-if="store.error && store.findings.length === 0"
      :message="store.error"
    />
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
      <EmptyState
        v-if="filteredFindings.length === 0"
        title="No findings"
        hint="All rules passed or no results for current filters"
        variant="ok"
      />
      <!-- List-Detail -->
      <ListDetail v-else>
        <template #list>
          <div class="flex h-full flex-col">
            <ListPaneBar
              :count="filteredFindings.length"
              :total="store.findings.length"
            />
            <div class="min-h-0 flex-1 overflow-y-auto">
              <FindingsList
                :findings="filteredFindings"
                :selected-id="selectedId"
                :kind-for="store.getKindForFinding"
                @select="selectFinding"
              />
            </div>
          </div>
        </template>

        <template #detail>
          <div
            v-if="selectedFinding"
            class="flex flex-1 flex-col overflow-hidden"
          >
            <DetailErrorBanner
              v-if="store.hasDetailError(selectedFinding.findingId)"
              class="m-4 mb-0"
            />
            <FindingDetail
              class="flex-1"
              :finding="selectedFinding"
              :kind="store.getKindForFinding(selectedFinding)"
              @navigate-resource="goToResource"
              @open-type="typesDrawer.openType"
            />
          </div>
          <div
            v-else
            class="flex flex-1 items-center justify-center"
          >
            <span class="font-mono text-label text-text-id">Select a finding to inspect</span>
          </div>
        </template>
      </ListDetail>
    </template>
    <!-- Finding Types slide-over drawer -->
    <SlideOverDrawer
      :open="typesDrawerOpen"
      title="Finding types"
      subtitle="FindingType"
      :count="store.typesLoaded ? store.findingTypes.length : undefined"
      @close="typesDrawer.close()"
    >
      <LoadingState
        v-if="store.typesLoading"
        label="Loading types..."
      />
      <!-- Type list -->
      <template v-else>
        <div class="w-56 shrink-0 overflow-y-auto border-r border-border-1">
          <div
            v-for="type in store.findingTypes"
            :key="type.findingTypeId"
            :data-row-id="type.findingTypeId"
            class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
            :class="
              type.findingTypeId === selectedTypeId
                ? 'border-l-accent bg-accent/5'
                : 'border-l-transparent hover:bg-bg-1'
            "
            @click="typesDrawer.select(type.findingTypeId)"
          >
            <div
              class="text-body font-medium"
              :class="type.findingTypeId === selectedTypeId ? 'text-accent-text' : 'text-text-1'"
            >
              {{ type.displayName }}
            </div>
            <div
              v-if="type.description"
              class="mt-1 truncate text-meta text-text-id"
            >
              {{ type.description }}
            </div>
          </div>
        </div>
        <!-- Type detail -->
        <div
          v-if="selectedType"
          class="flex-1 overflow-y-auto px-6 py-5"
        >
          <h3 class="text-title font-medium text-text-1">{{ selectedType.displayName }}</h3>
          <div class="mt-2 flex items-center gap-2">
            <span class="font-mono text-label text-text-id">{{ selectedType.findingTypeId }}</span>
            <CopyButton
              :value="selectedType.findingTypeId"
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
            <SectionLabel :count="Object.keys(selectedType.annotations).length">
              Annotations
            </SectionLabel>
            <AnnotationsTable
              :annotations="selectedType.annotations"
              layout="stacked"
            />
          </div>
        </div>
        <div
          v-else
          class="flex flex-1 items-center justify-center"
        >
          <span class="font-mono text-label text-text-id">Select a finding type</span>
        </div>
      </template>
    </SlideOverDrawer>
  </div>
</template>
