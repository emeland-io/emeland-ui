<script setup lang="ts">
import { computed } from 'vue'
import { useMetricsStore } from '@/stores/metrics'
import { useFindingsStore } from '@/stores/findings'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import SectionLabel from '@/components/SectionLabel.vue'
import TypeTag from '@/components/TypeTag.vue'
import DetailHeader from '@/components/detail/DetailHeader.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import MetricInstancesTable from '@/components/metrics/MetricInstancesTable.vue'
import { pluralize } from '@/utils/text'
import { metricDimension, metricUnit } from '@/types/metric'
import type { Metric, MetricInstance } from '@/types/metric'
import type { Finding } from '@/types/finding'

const props = defineProps<{
  metric: Metric | undefined
  instances: MetricInstance[]
  activeInstanceId?: string
}>()

const emit = defineEmits<{
  'open-instance': [id: string]
}>()

const store = useMetricsStore()
const findingsStore = useFindingsStore()

const dimension = computed(() => (props.metric ? metricDimension(props.metric) : undefined))
const unit = computed(() => (props.metric ? metricUnit(props.metric) : undefined))

const breachedCount = computed(
  () =>
    props.instances.filter((i) => store.statusByInstance.get(i.metricInstanceId) === 'breached')
      .length,
)

// findings on the metric itself and on any of its instances
const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => [props.metric?.metricId ?? '', ...props.instances.map((i) => i.metricInstanceId)],
)

/** which instance a rolled-up finding belongs to; none when it is on the metric */
function findingNote(f: Finding): string | undefined {
  const own = new Set(props.instances.map((i) => i.metricInstanceId))
  const res = f.resources.find((r) => own.has(r.resourceId))
  if (!res) return undefined
  const name = store.metricInstanceMap.get(res.resourceId)?.displayName || res.displayName
  return `on ${name}`
}
</script>

<template>
  <div
    v-if="metric"
    class="@container flex-1 overflow-y-auto"
  >
    <DetailHeader
      :id="metric.metricId"
      :title="metric.displayName"
    >
      <TypeTag>Metric</TypeTag>
      <TypeTag
        v-if="dimension"
        tone="muted"
        title="Dimension"
      >
        {{ dimension }}
      </TypeTag>
      <TypeTag
        v-if="unit"
        tone="muted"
        title="Unit"
      >
        {{ unit }}
      </TypeTag>
      <TypeTag
        v-if="breachedCount > 0"
        tone="warning"
        :title="`${pluralize(breachedCount, 'instance')} over limit (derived from current values)`"
      >
        {{ breachedCount }} over limit
      </TypeTag>
    </DetailHeader>
    <div class="flex flex-col gap-5 px-6 py-5">
      <DetailErrorBanner
        v-if="store.hasDetailError(metric.metricId)"
        :message="store.detailErrorMessage(metric.metricId)"
      />

      <p
        v-if="metric.description"
        class="text-body leading-relaxed text-text-2"
      >
        {{ metric.description }}
      </p>

      <!-- readings -->
      <MetricInstancesTable
        v-if="instances.length > 0"
        :instances="instances"
        :metric="metric"
        :active-instance-id="activeInstanceId"
        @select="emit('open-instance', $event)"
      />
      <div v-else>
        <SectionLabel :count="0">Metric instances</SectionLabel>
        <p class="text-data leading-snug text-text-4">No metric instances reference this metric.</p>
      </div>

      <!-- descriptive parts -->
      <div
        class="grid gap-x-8 gap-y-5 border-t border-border-1 pt-5 @3xl:grid-cols-2 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8"
      >
        <!-- Related findings -->
        <DetailFindingsSection
          :findings="relatedFindings"
          :note-for="findingNote"
        />
        <!-- Annotations -->
        <DetailAnnotationsSection :annotations="metric.annotations" />
      </div>
    </div>
  </div>
  <DetailEmptyState
    v-else
    label="Select a metric to inspect"
  />
</template>
