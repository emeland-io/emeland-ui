<script setup lang="ts">
import { computed } from 'vue'
import { useMetricsStore } from '@/stores/metrics'
import { useFindingsStore } from '@/stores/findings'
import { useSubjectLabels } from '@/composables/useSubjectLabels'
import { useResourceNav } from '@/composables/useResourceNav'
import { useDrawerNav } from '@/composables/useDrawerNav'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import TypeTag from '@/components/TypeTag.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'
import MappingTag from '@/components/MappingTag.vue'
import RelationRow from '@/components/RelationRow.vue'
import CopyButton from '@/components/CopyButton.vue'
import DrawerIdRow from '@/components/drawer/DrawerIdRow.vue'
import DrawerAnnotationsSection from '@/components/drawer/DrawerAnnotationsSection.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import ValueScale from '@/components/metrics/ValueScale.vue'
import ReadingMarker from '@/components/metrics/ReadingMarker.vue'
import SubjectGlyph from '@/components/metrics/SubjectGlyph.vue'
import { mappingStateOf } from '@/utils/mapping'
import { resourceLabel } from '@/constants/resources'
import {
  INSTANCE_STATUS_LABEL,
  INSTANCE_STATUS_TEXT_CLASS,
  INSTANCE_STATUS_TITLE,
  INSTANCE_STATUS_TONE,
  METRIC_ANN,
  evaluateThreshold,
  formatThreshold,
  instanceUnit,
  metricExpression,
  metricLanguage,
  orderedThresholds,
  thresholdLanguage,
} from '@/types/metric'
import type { InstanceStatus, Threshold } from '@/types/metric'

const props = defineProps<{
  open: boolean
  selectedInstanceId: string
  navIds?: string[]
}>()

const emit = defineEmits<{
  close: []
  navigate: [id: string]
  'nav-exit': [step: number]
  'go-to-metric': [id: string]
}>()

const store = useMetricsStore()
const findingsStore = useFindingsStore()
const { subjectLabel, subjectNavTarget } = useSubjectLabels()
const { goToResource } = useResourceNav()

const instance = computed(() => store.metricInstanceMap.get(props.selectedInstanceId))
const metric = computed(() =>
  instance.value?.metricId ? store.metricMap.get(instance.value.metricId) : undefined,
)
const unit = computed(() =>
  instance.value ? instanceUnit(instance.value, metric.value) : undefined,
)
const values = computed(() =>
  instance.value ? store.getValuesFor(instance.value.metricInstanceId) : [],
)

const thresholds = computed(() =>
  instance.value
    ? orderedThresholds(store.getThresholdsFor(instance.value.metricInstanceId), values.value)
    : [],
)
const status = computed<InstanceStatus>(() =>
  instance.value
    ? (store.statusByInstance.get(instance.value.metricInstanceId) ?? 'no-reading')
    : 'no-reading',
)

const mappingState = computed(() =>
  instance.value
    ? mappingStateOf(instance.value.metricId, store.metricMap.has(instance.value.metricId ?? ''))
    : undefined,
)

const expression = computed(() =>
  instance.value ? metricExpression(instance.value.annotations) : undefined,
)
const language = computed(() =>
  instance.value ? metricLanguage(instance.value.annotations) : undefined,
)

// the expression gets its own section; keep it out of the well-known table
const wellKnown = computed(() => {
  const ann = { ...(instance.value?.annotations ?? {}) }
  delete ann[METRIC_ANN.expression]
  delete ann[METRIC_ANN.language]
  return ann
})

const navTarget = computed(() => subjectNavTarget(instance.value?.subject))

function breached(t: Threshold): boolean {
  return values.value.some((v) => evaluateThreshold(t, v.value) === 'breached')
}

function readingBreached(value: string): boolean {
  return thresholds.value.some((t) => evaluateThreshold(t, value) === 'breached')
}

function goToSubject() {
  const target = navTarget.value
  if (!target) return
  emit('close')
  goToResource(target.type, target.id)
}

const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => instance.value?.metricInstanceId ?? '',
)

const { navIndex, step: stepInstance } = useDrawerNav({
  navIds: () => props.navIds,
  current: () => props.selectedInstanceId,
  onNavigate: (id) => emit('navigate', id),
  onExit: (step) => emit('nav-exit', step),
})
</script>

<template>
  <SlideOverDrawer
    :open="open"
    :title="instance?.displayName ?? 'Metric instance'"
    subtitle="MetricInstance"
    :nav-index="navIndex >= 0 ? navIndex : undefined"
    :nav-count="navIndex >= 0 ? navIds?.length : undefined"
    @close="emit('close')"
    @nav-prev="stepInstance(-1)"
    @nav-next="stepInstance(1)"
  >
    <template #header-tags>
      <MappingTag :state="mappingState" />
      <TypeTag
        v-if="unit"
        tone="muted"
        title="Unit"
      >
        {{ unit }}
      </TypeTag>
      <TypeTag
        v-if="instance"
        :tone="INSTANCE_STATUS_TONE[status]"
        :title="INSTANCE_STATUS_TITLE[status]"
        :class="INSTANCE_STATUS_TEXT_CLASS[status]"
      >
        {{ INSTANCE_STATUS_LABEL[status] }}
      </TypeTag>
    </template>
    <div
      v-if="instance"
      class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
    >
      <!-- identity -->
      <div>
        <DrawerIdRow
          label="Instance ID"
          :value="instance.metricInstanceId"
        />
        <WellKnownAnnotationsTable
          :annotations="wellKnown"
          columns="minmax(160px, 30%) minmax(0, 1fr)"
        />
      </div>

      <p
        v-if="instance.description"
        class="text-body leading-relaxed text-text-2"
      >
        {{ instance.description }}
      </p>

      <!-- current reading -->
      <div>
        <div class="flex items-start justify-between gap-3">
          <SectionLabel :count="values.length">Current value</SectionLabel>
          <!-- what the readings describe -->
          <component
            :is="navTarget ? 'button' : 'span'"
            v-if="instance.subject"
            :type="navTarget ? 'button' : undefined"
            data-reading-subject
            class="group/subject mb-3 flex min-w-0 items-center gap-1.5 text-left font-mono text-micro"
            :title="navTarget ? `Go to ${resourceLabel(navTarget.type)}` : undefined"
            @click="goToSubject"
          >
            <SubjectGlyph :type="instance.subject.resourceType" />
            <span class="shrink-0 text-text-4">
              {{ resourceLabel(instance.subject.resourceType) }}
            </span>
            <span
              class="truncate text-text-3 transition-colors"
              :class="navTarget ? 'group-hover/subject:text-accent' : ''"
            >
              {{ subjectLabel(instance.subject) }}
            </span>
          </component>
        </div>
        <p
          v-if="values.length === 0"
          class="text-data leading-snug text-text-4"
        >
          No current reading.
        </p>
        <div
          v-for="(v, i) in values"
          :key="v.metricValueId"
          class="flex items-baseline gap-2 border-b border-border-1 py-2 last:border-b-0"
        >
          <ReadingMarker
            v-if="values.length > 1"
            class="self-center"
            :index="i + 1"
            :breached="readingBreached(v.value)"
            numbered
          />
          <span
            data-reading-value
            class="font-mono text-display tabular-nums"
            :class="readingBreached(v.value) ? 'text-warning' : 'text-text-1'"
          >
            {{ v.value }}
          </span>
          <span
            v-if="unit"
            class="font-mono text-meta text-text-3"
          >
            {{ unit }}
          </span>
          <span class="min-w-0 truncate text-label text-text-3">{{ v.displayName }}</span>
          <span
            v-if="v.description"
            class="ml-auto min-w-0 truncate text-meta text-text-4"
            :title="v.description"
          >
            {{ v.description }}
          </span>
        </div>
        <ValueScale
          :values="values"
          :thresholds="thresholds"
          :unit="unit"
        />
      </div>

      <!-- thresholds -->
      <div>
        <SectionLabel
          :count="thresholds.length"
          tone="warning"
        >
          Thresholds
        </SectionLabel>
        <p
          v-if="thresholds.length === 0"
          class="text-data leading-snug text-text-4"
        >
          No thresholds.
        </p>
        <div
          v-for="t in thresholds"
          :key="t.thresholdId"
          class="flex flex-col gap-1 border-b border-border-1 py-2 last:border-b-0"
        >
          <div
            class="flex min-w-0 items-center gap-2"
            :title="t.thresholdId"
          >
            <span class="min-w-0 truncate text-body text-text-1">{{ t.displayName }}</span>
            <TypeTag
              v-if="breached(t)"
              tone="warning"
              title="The current value breaches this threshold (derived client-side; the server does not evaluate thresholds)"
            >
              over limit
            </TypeTag>
          </div>
          <div class="flex min-w-0 items-start gap-2">
            <span
              v-if="thresholdLanguage(t)"
              class="shrink-0 rounded bg-bg-2 px-1.5 py-0.5 font-mono text-micro text-text-4"
            >
              {{ thresholdLanguage(t) }}
            </span>
            <code
              v-if="formatThreshold(t, unit)"
              class="min-w-0 break-all font-mono text-meta text-text-2"
            >
              {{ formatThreshold(t, unit) }}
            </code>
            <span
              v-else
              class="text-meta text-text-4"
            >
              No condition declared.
            </span>
          </div>
          <p
            v-if="t.description"
            class="text-label text-text-4"
          >
            {{ t.description }}
          </p>
        </div>
      </div>

      <!-- metric -->
      <div>
        <SectionLabel>Metric</SectionLabel>
        <p
          v-if="!instance.metricId"
          class="text-data leading-snug text-text-4"
        >
          No metric reference.
        </p>
        <RelationRow
          v-else-if="metric"
          :id="metric.metricId"
          badge="Metric"
          :name="metric.displayName"
          clickable
          title="Go to metric"
          @click="emit('go-to-metric', metric.metricId)"
        />
        <RelationRow
          v-else
          :id="instance.metricId"
          badge="Metric"
          badge-tone="error"
          name="Unresolved metric"
          name-tone="error"
        />
      </div>

      <!-- subject -->
      <div>
        <SectionLabel>Subject</SectionLabel>
        <p
          v-if="!instance.subject"
          class="text-data leading-snug text-text-4"
        >
          No subject linked.
        </p>
        <RelationRow
          v-else
          :id="instance.subject.resourceId"
          :badge="resourceLabel(instance.subject.resourceType)"
          :name="subjectLabel(instance.subject)"
          :clickable="!!navTarget"
          :title="navTarget ? `Go to ${resourceLabel(navTarget.type)}` : undefined"
          @click="goToSubject"
        />
      </div>

      <!-- expression -->
      <div v-if="expression">
        <SectionLabel>Expression</SectionLabel>
        <div class="flex items-start gap-2">
          <span
            v-if="language"
            class="shrink-0 rounded bg-bg-2 px-1.5 py-0.5 font-mono text-micro text-text-3"
          >
            {{ language }}
          </span>
          <code class="min-w-0 flex-1 break-all font-mono text-meta text-text-2">
            {{ expression }}
          </code>
          <CopyButton
            :value="expression"
            :size="13"
            class="mt-0.5"
          />
        </div>
      </div>

      <!-- findings about this instance -->
      <DetailFindingsSection :findings="relatedFindings" />

      <!-- annotations -->
      <DrawerAnnotationsSection :annotations="instance.annotations" />
    </div>
    <DetailEmptyState
      v-else
      label="Instance not found"
    />
  </SlideOverDrawer>
</template>
