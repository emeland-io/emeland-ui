<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFindingsStore } from '@/stores/findings'
import FindingsToolbar from '@/components/findings/FindingsToolbar.vue'
import FindingsList from '@/components/findings/FindingsList.vue'
import FindingDetail from '@/components/findings/FindingDetail.vue'
import ListDetail from '@/components/ListDetail.vue'
import TypesDrawerShell from '@/components/drawer/TypesDrawerShell.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import ResourceViewShell from '@/components/view/ResourceViewShell.vue'
import CopyButton from '@/components/CopyButton.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useResourceNav } from '@/composables/useResourceNav'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useResourceSelection } from '@/composables/useResourceSelection'
import { useTypesDrawer } from '@/composables/useTypesDrawer'
import { toggledSet } from '@/utils/set'
import { matchesQuery } from '@/utils/search'
import type { Finding, FindingType } from '@/types/finding'

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

const {
  selectedId,
  selected: selectedFinding,
  select: selectFinding,
} = useResourceSelection<Finding>({
  items: () => store.findings,
  filtered: () => filteredFindings.value,
  idOf: (f) => f.findingId,
  loadDetail: (id) => store.loadFindingDetail(id),
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
  <ResourceViewShell
    :loading="store.loading"
    loading-label="Loading findings..."
    :error="store.error"
    :error-list-empty="store.findings.length === 0"
    retry-label="Retry"
    @retry="store.load()"
  >
    <template #header>
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
    </template>

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
            :message="store.detailErrorMessage(selectedFinding.findingId)"
          />
          <FindingDetail
            class="flex-1"
            :finding="selectedFinding"
            :kind="store.getKindForFinding(selectedFinding)"
            @navigate-resource="goToResource"
            @open-type="typesDrawer.openType"
          />
        </div>
        <DetailEmptyState
          v-else
          label="Select a finding to inspect"
        />
      </template>
    </ListDetail>

    <template #drawers>
      <!-- Finding Types slide-over drawer -->
      <TypesDrawerShell
        :open="typesDrawerOpen"
        title="Finding types"
        subtitle="FindingType"
        :count="store.typesLoaded ? store.findingTypes.length : undefined"
        :loading="store.typesLoading"
        :types="store.findingTypes"
        :id-of="(t: FindingType) => t.findingTypeId"
        :selected-id="selectedTypeId"
        :has-detail="!!selectedType"
        empty-label="Select a finding type"
        list-width="w-56"
        row-class="px-4 py-3"
        @close="typesDrawer.close()"
        @select="typesDrawer.select"
      >
        <template #row="{ type, selected }">
          <div
            class="text-body font-medium"
            :class="selected ? 'text-accent-text' : 'text-text-1'"
          >
            {{ type.displayName }}
          </div>
          <div
            v-if="type.description"
            class="mt-1 truncate text-meta text-text-3"
          >
            {{ type.description }}
          </div>
        </template>
        <template #detail>
          <template v-if="selectedType">
            <h3 class="text-title font-medium text-text-1">{{ selectedType.displayName }}</h3>
            <div class="mt-2 flex items-center gap-2">
              <span class="font-mono text-label text-text-3">
                {{ selectedType.findingTypeId }}
              </span>
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
            <DetailAnnotationsSection
              v-if="Object.keys(selectedType.annotations).length > 0"
              class="mt-6"
              :annotations="selectedType.annotations"
            />
          </template>
        </template>
      </TypesDrawerShell>
    </template>
  </ResourceViewShell>
</template>
