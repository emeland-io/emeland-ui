<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMetricsStore } from '@/stores/metrics'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import MetricsToolbar from '@/components/metrics/MetricsToolbar.vue'
import MetricsList from '@/components/metrics/MetricsList.vue'
import MetricDetail from '@/components/metrics/MetricDetail.vue'
import MetricInstanceDrawer from '@/components/metrics/MetricInstanceDrawer.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import ResourceViewShell from '@/components/view/ResourceViewShell.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useResourceSelection } from '@/composables/useResourceSelection'
import { useInstanceDrawer } from '@/composables/useInstanceDrawer'
import { useMetricRefGroups } from '@/composables/useUnmappedGroups'
import { useSubjectLabels } from '@/composables/useSubjectLabels'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { resourceLabel } from '@/constants/resources'
import { toggledSet } from '@/utils/set'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import {
  INSTANCE_STATUSES,
  INSTANCE_STATUS_LABEL,
  compareByName,
  metricDimension,
} from '@/types/metric'
import type { InstanceStatus, Metric, MetricInstance } from '@/types/metric'

/**
 * Metrics as list | detail: the vocabulary on the left, the selected metric's
 * instances with their current readings on the right, each instance's values
 * and thresholds in the drawer.
 */
const store = useMetricsStore()
const findingsStore = useFindingsStore()
const subjects = useSubjectLabels()

const search = ref('')
const activeDimensions = ref<Set<string>>(new Set())
const activeStatuses = ref<Set<string>>(new Set())
const activeSubjectTypes = ref<Set<string>>(new Set())

const listCollapsed = ref(false)
const listCollapsedEffective = computed(() => listCollapsed.value && !search.value.trim())

const statusCounts = computed(() => {
  const counts = new Map<InstanceStatus, number>()
  for (const s of store.statusByInstance.values()) counts.set(s, (counts.get(s) ?? 0) + 1)
  return counts
})

const statusChips = computed(() =>
  INSTANCE_STATUSES.map((s) => ({
    id: s,
    name: INSTANCE_STATUS_LABEL[s],
    title: `${statusCounts.value.get(s) ?? 0} ${INSTANCE_STATUS_LABEL[s]} (derived from current values)`,
  })),
)

const subjectChips = computed(() =>
  store.subjectTypes.map((t) => ({ id: t, name: resourceLabel(t) })),
)

const hasActiveFilters = computed(
  () =>
    !!search.value ||
    activeDimensions.value.size > 0 ||
    activeStatuses.value.size > 0 ||
    activeSubjectTypes.value.size > 0,
)

function instanceMatchesChips(inst: MetricInstance): boolean {
  if (
    activeSubjectTypes.value.size > 0 &&
    !(inst.subject && activeSubjectTypes.value.has(inst.subject.resourceType))
  ) {
    return false
  }
  if (
    activeStatuses.value.size > 0 &&
    !activeStatuses.value.has(store.statusByInstance.get(inst.metricInstanceId) ?? 'no-reading')
  ) {
    return false
  }
  return true
}

function instanceMatchesSearch(inst: MetricInstance): boolean {
  return (
    matchesQuery(
      search.value,
      inst.displayName,
      inst.description,
      inst.metricInstanceId,
      subjects.subjectLabel(inst.subject),
    ) || matchesAnnotations(search.value, inst.annotations)
  )
}

function metricMatchesSearch(m: Metric): boolean {
  return (
    matchesQuery(search.value, m.displayName, m.description, m.metricId) ||
    matchesAnnotations(search.value, m.annotations)
  )
}

const chipFilteredMetrics = computed(() =>
  store.metrics.filter((m) => {
    if (activeDimensions.value.size > 0 && !activeDimensions.value.has(metricDimension(m) ?? ''))
      return false
    if (
      (activeStatuses.value.size > 0 || activeSubjectTypes.value.size > 0) &&
      !store.getInstancesForMetric(m.metricId).some(instanceMatchesChips)
    )
      return false
    return true
  }),
)

// a metric matches the search itself or through one of its instances
const filteredMetrics = computed(() =>
  chipFilteredMetrics.value
    .filter(
      (m) =>
        metricMatchesSearch(m) ||
        store.getInstancesForMetric(m.metricId).some(instanceMatchesSearch),
    )
    .sort((a, b) => compareByName(a, b, (m) => m.metricId)),
)

// instances without a resolvable metric, filtered by the same toolbar filters
// (a dimension filter excludes them: without a metric there is no dimension)
const unmappedFiltered = computed(() => {
  if (activeDimensions.value.size > 0) return []
  return store.unmappedInstances
    .filter((i) => instanceMatchesChips(i) && instanceMatchesSearch(i))
    .sort((a, b) => compareByName(a, b, (i) => i.metricInstanceId))
})

function toggleDimension(id: string) {
  activeDimensions.value = toggledSet(activeDimensions.value, id)
}

function toggleStatus(id: string) {
  activeStatuses.value = toggledSet(activeStatuses.value, id)
}

function toggleSubjectType(id: string) {
  activeSubjectTypes.value = toggledSet(activeSubjectTypes.value, id)
}

function clearFilters() {
  search.value = ''
  activeDimensions.value = new Set()
  activeStatuses.value = new Set()
  activeSubjectTypes.value = new Set()
}

const {
  selectedId,
  selected: selectedMetric,
  select: selectMetric,
} = useResourceSelection<Metric>({
  items: () => store.metrics,
  filtered: () => filteredMetrics.value,
  idOf: (m) => m.metricId,
  loadDetail: (id) => store.loadMetricDetail(id),
})

const selectedInstances = computed(() =>
  selectedId.value ? store.getInstancesForMetric(selectedId.value) : [],
)

const detailOrderedIds = ref<string[]>([])

function instancesForDrawer(metricId: string): MetricInstance[] {
  const fromTable =
    metricId === selectedId.value
      ? detailOrderedIds.value
          .map((id) => store.metricInstanceMap.get(id))
          .filter((i): i is MetricInstance => !!i && i.metricId === metricId)
      : []
  return fromTable.length > 0 ? fromTable : store.getInstancesForMetric(metricId)
}

const { unmappedOrderedIds } = useMetricRefGroups(
  unmappedFiltered,
  (i) => i.metricId,
  (i) => i.metricInstanceId,
)

const {
  drawerOpen: instanceDrawerOpen,
  selectedInstanceId,
  openInstance,
  drawerNavIds,
  onDrawerNavExit,
  openFirstUnmapped,
} = useInstanceDrawer<MetricInstance>({
  instances: () => store.metricInstances,
  instanceId: (i) => i.metricInstanceId,
  instanceParent: (i) => i.metricId,
  unmappedOrderedIds: () => unmappedOrderedIds.value,
  unmappedFiltered: () => unmappedFiltered.value,
  selectedId,
  instancesFor: instancesForDrawer,
  lastResourceRowId: () => filteredMetrics.value.at(-1)?.metricId,
  selectResource: selectMetric,
})

useListKeyboardNav(
  computed(() =>
    listCollapsedEffective.value ? [] : filteredMetrics.value.map((m) => m.metricId),
  ),
  selectedId,
  selectMetric,
  instanceDrawerOpen,
  openFirstUnmapped,
)

onMounted(async () => {
  findingsStore.load()
  await store.load()
  // descriptions and annotations live in the details (searchable); instances,
  // thresholds and values are the readings
  await Promise.all([store.loadAllDetails(), store.loadRelated()])
  // subject names come from the stores of whatever the instances measure
  await subjects.ensureLoaded(store.subjectTypes)
})
</script>

<template>
  <ResourceViewShell
    :loading="store.loading"
    loading-label="Loading metrics..."
    :error="store.error"
    :error-list-empty="store.metrics.length === 0"
    retry-label="Retry"
    @retry="store.load()"
  >
    <template #header>
      <ViewHeader
        title="Metrics"
        :count="store.metrics.length"
      >
        <span class="font-mono text-label text-text-3">
          {{ store.metricInstances.length }} instances
        </span>
        <span
          class="font-mono text-label"
          :class="store.unmappedInstances.length > 0 ? 'text-warning' : 'text-text-4'"
        >
          {{ store.unmappedInstances.length }} unmapped
        </span>
        <span
          class="font-mono text-label"
          :class="store.breachedCount > 0 ? 'text-warning' : 'text-text-4'"
          title="Instances whose current value breaches an operator threshold (derived client-side)"
        >
          {{ store.breachedCount }} over limit
        </span>
      </ViewHeader>
    </template>

    <MetricsToolbar
      v-model:search="search"
      :dimensions="store.dimensions"
      :active-dimensions="activeDimensions"
      :statuses="statusChips"
      :active-statuses="activeStatuses"
      :subject-types="subjectChips"
      :active-subject-types="activeSubjectTypes"
      :has-active-filters="hasActiveFilters"
      @toggle-dimension="toggleDimension"
      @toggle-status="toggleStatus"
      @toggle-subject-type="toggleSubjectType"
      @clear="clearFilters"
    />

    <!-- Empty state (unmapped instances may still match the search) -->
    <EmptyState
      v-if="filteredMetrics.length === 0 && unmappedFiltered.length === 0"
      title="No metrics"
      :hint="hasActiveFilters ? 'No results for current filters' : 'No metrics discovered yet'"
    />

    <!-- list | detail -->
    <ListDetail v-else>
      <template #list>
        <div class="flex h-full flex-col">
          <ListPaneBar
            :count="filteredMetrics.length"
            :total="store.metrics.length"
            :collapsed="listCollapsedEffective"
            @toggle="listCollapsed = !listCollapsed"
          />
          <div class="min-h-0 flex-1 overflow-y-auto">
            <MetricsList
              :metrics="filteredMetrics"
              :selected-id="selectedId"
              :unmapped="unmappedFiltered"
              :active-instance-id="instanceDrawerOpen ? selectedInstanceId : ''"
              :force-expanded="!!search.trim()"
              :list-collapsed="listCollapsedEffective"
              @select="selectMetric"
              @open-instance="openInstance"
            />
          </div>
        </div>
      </template>

      <template #detail>
        <MetricDetail
          :metric="selectedMetric"
          :instances="selectedInstances"
          :active-instance-id="instanceDrawerOpen ? selectedInstanceId : ''"
          @open-instance="openInstance"
          @update:ordered-ids="detailOrderedIds = $event"
        />
      </template>
    </ListDetail>

    <template #drawers>
      <MetricInstanceDrawer
        :open="instanceDrawerOpen"
        :selected-instance-id="selectedInstanceId"
        :nav-ids="drawerNavIds"
        @close="instanceDrawerOpen = false"
        @navigate="(id) => (selectedInstanceId = id)"
        @nav-exit="onDrawerNavExit"
        @go-to-metric="
          (id) => {
            instanceDrawerOpen = false
            selectMetric(id)
          }
        "
      />
    </template>
  </ResourceViewShell>
</template>
