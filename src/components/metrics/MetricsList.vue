<script setup lang="ts">
import { computed } from 'vue'
import { useMetricsStore } from '@/stores/metrics'
import { useFindingsStore } from '@/stores/findings'
import { useSubjectLabels } from '@/composables/useSubjectLabels'
import { useMetricRefGroups } from '@/composables/useUnmappedGroups'
import MappingTag from '@/components/MappingTag.vue'
import TypeGlyph from '@/components/TypeGlyph.vue'
import UnmappedSection from '@/components/UnmappedSection.vue'
import ResourceListRow from '@/components/list/ResourceListRow.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'
import { mappingStateOf } from '@/utils/mapping'
import { pluralize } from '@/utils/text'
import { metricDimension, metricUnit } from '@/types/metric'
import type { Metric, MetricInstance } from '@/types/metric'

const props = withDefaults(
  defineProps<{
    metrics: Metric[]
    selectedId: string
    /** instances without a resolvable metric, shown in their own section */
    unmapped?: MetricInstance[]
    /** keep the unmapped section expanded (e.g. while a search is active) */
    forceExpanded?: boolean
    /** fold the main rows away (e.g. to focus on the unmapped section) */
    listCollapsed?: boolean
    /** instance currently shown in the drawer, marked with an accent indicator */
    activeInstanceId?: string
  }>(),
  { unmapped: () => [], forceExpanded: false, listCollapsed: false, activeInstanceId: '' },
)

const emit = defineEmits<{
  select: [id: string]
  'open-instance': [id: string]
}>()

const store = useMetricsStore()
const findingsStore = useFindingsStore()
const { subjectLabel } = useSubjectLabels()

// group the section by the (missing) metric each unmapped instance references
const { unmappedGroups, unmappedGroupTitle } = useMetricRefGroups(
  () => props.unmapped,
  (i) => i.metricId,
  (i) => i.metricInstanceId,
)

function instanceCount(id: string): number {
  return store.getInstancesForMetric(id).length
}

/** instances over limit per metric (derived from current values) */
const breachedByMetric = computed(() => {
  const counts = new Map<string, number>()
  for (const [id, status] of store.statusByInstance) {
    if (status !== 'breached') continue
    const metricId = store.metricInstanceMap.get(id)?.metricId
    if (metricId) counts.set(metricId, (counts.get(metricId) ?? 0) + 1)
  }
  return counts
})

function breachedCount(id: string): number {
  return breachedByMetric.value.get(id) ?? 0
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function mappingState(inst: MetricInstance) {
  return mappingStateOf(inst.metricId, store.metricMap.has(inst.metricId ?? ''))
}
</script>

<template>
  <template v-if="!listCollapsed">
    <ResourceListRow
      v-for="metric in metrics"
      :id="metric.metricId"
      :key="metric.metricId"
      :title="metric.displayName"
      :selected="metric.metricId === selectedId"
      @select="emit('select', $event)"
    >
      <span
        v-if="metricDimension(metric)"
        class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta text-text-3"
        title="Dimension"
      >
        {{ metricDimension(metric) }}
      </span>
      <span
        v-if="metricUnit(metric)"
        class="font-mono text-meta text-text-4"
        title="Unit"
      >
        {{ metricUnit(metric) }}
      </span>
      <template #badges>
        <FindingsBadge :count="findingCount(metric.metricId)" />
        <span
          v-if="breachedCount(metric.metricId) > 0"
          class="flex shrink-0 items-center rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
          :title="`${pluralize(breachedCount(metric.metricId), 'instance')} over limit (derived from current values)`"
        >
          {{ breachedCount(metric.metricId) }} over limit
        </span>
        <InstanceCountBadge
          v-if="store.instancesLoaded"
          :count="instanceCount(metric.metricId)"
          noun="metric instance"
          glyph="metric"
        />
      </template>
    </ResourceListRow>
  </template>

  <!-- instances without a resolvable metric -->
  <UnmappedSection
    :groups="unmappedGroups"
    :id-of="(i) => i.metricInstanceId"
    :group-key-of="(i) => i.metricId || ''"
    :group-title="unmappedGroupTitle"
    :force-expanded="forceExpanded"
    :active-instance-id="activeInstanceId"
    @open="(id) => emit('open-instance', id)"
  >
    <template #meta="{ inst }">
      <MappingTag :state="mappingState(inst)" />
      <span
        v-if="inst.subject"
        class="flex min-w-0 items-center gap-1 font-mono text-meta text-text-4"
        :title="`${inst.subject.resourceType} ${inst.subject.resourceId}`"
      >
        <TypeGlyph :type="inst.subject.resourceType" />
        <span class="truncate">{{ subjectLabel(inst.subject) }}</span>
      </span>
    </template>
  </UnmappedSection>
</template>
