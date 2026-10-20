<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowUpRight,
  IconLayoutSidebarRight,
  IconMathFunction,
  IconSearch,
} from '@tabler/icons-vue'
import { useMetricsStore } from '@/stores/metrics'
import { useFindingsStore } from '@/stores/findings'
import { useSubjectLabels } from '@/composables/useSubjectLabels'
import { useResourceNav } from '@/composables/useResourceNav'
import { useColumnWidths } from '@/composables/useColumnWidths'
import { resourceLabel } from '@/constants/resources'
import SubjectGlyph from '@/components/metrics/SubjectGlyph.vue'
import TypeTag from '@/components/TypeTag.vue'
import SkeletonBlock from '@/components/view/SkeletonBlock.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import {
  INSTANCE_STATUSES,
  INSTANCE_STATUS_LABEL,
  INSTANCE_STATUS_TITLE,
  METRIC_ANN,
  evaluateThreshold,
  formatThreshold,
  instanceUnit,
  metricExpression,
  metricLanguage,
  metricUnit,
  orderedThresholds,
  parseMetricNumber,
  thresholdLanguage,
} from '@/types/metric'
import type {
  InstanceStatus,
  Metric,
  MetricInstance,
  MetricSubject,
  MetricValue,
  Threshold,
} from '@/types/metric'

const props = withDefaults(
  defineProps<{
    instances: MetricInstance[]
    /** the metric the instances belong to (unit fallback) */
    metric: Metric
    /** instance currently shown in the drawer */
    activeInstanceId?: string
  }>(),
  { activeInstanceId: '' },
)

const emit = defineEmits<{
  select: [id: string]
  'update:orderedIds': [ids: string[]]
}>()

const store = useMetricsStore()
const findingsStore = useFindingsStore()
const { subjectLabel, subjectNavTarget } = useSubjectLabels()
const { goToResource } = useResourceNav()

function goToSubject(subject: MetricSubject) {
  const target = subjectNavTarget(subject)
  if (target) goToResource(target.type, target.id)
}

function subjectTitle(subject: MetricSubject): string {
  const target = subjectNavTarget(subject)
  return target
    ? `Go to ${resourceLabel(target.type)}`
    : `${subject.resourceType} ${subject.resourceId}`
}

type SortKey = 'name' | 'subject' | 'value' | 'thresholds' | 'status'
const sortKey = ref<SortKey>('status')
const sortAsc = ref(true)

interface Column {
  key: SortKey
  label: string
  align?: 'right'
  /** initial width in px; the name column starts auto and takes the rest */
  width?: number
  min?: number
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Instance', min: 160 },
  { key: 'subject', label: 'Subject', width: 192, min: 96 },
  { key: 'value', label: 'Value', align: 'right', width: 120, min: 80 },
  { key: 'thresholds', label: 'Threshold', width: 208, min: 120 },
  { key: 'status', label: 'Status', width: 104, min: 96 },
]

const INDICATOR_WIDTH = 24

const {
  isResizing,
  onResizeStart,
  reset: resetColumn,
  colStyle,
  hasAuto,
  minTotalWidth,
} = useColumnWidths(COLUMNS, { storageKey: 'emeland-metric-instance-columns' })

const tableStyle = computed(() => ({ minWidth: `${minTotalWidth.value + INDICATOR_WIDTH}px` }))

const fillerStyle = computed(() => (hasAuto.value ? { width: '0px' } : undefined))

/** thresholds listed per row before "+n more" takes over */
const MAX_THRESHOLDS = 3

const STATUS_TONE: Record<InstanceStatus, 'warning' | 'muted'> = {
  breached: 'warning',
  ok: 'muted',
  unknown: 'muted',
  'no-reading': 'muted',
}

const search = ref('')
const showFilter = computed(() => props.instances.length > 8)

const relatedLoading = computed(() => store.valuesLoading || store.thresholdsLoading)

interface Reading {
  value: MetricValue
  breached: boolean
}

interface ThresholdRow {
  threshold: Threshold
  condition: string | undefined
  breached: boolean
}

interface Row {
  inst: MetricInstance
  id: string
  subject: string
  unit: string | undefined
  unitOverride: boolean
  expression: string | undefined
  language: string | undefined
  findings: number
  values: MetricValue[]
  readings: Reading[]
  primary: string | undefined
  numeric: number | undefined
  thresholds: Threshold[]
  thresholdRows: ThresholdRow[]
  status: InstanceStatus
}

const rows = computed<Row[]>(() =>
  props.instances.map((inst) => {
    const id = inst.metricInstanceId
    const unit = instanceUnit(inst, props.metric)
    const values = store.getValuesFor(id)
    const thresholds = orderedThresholds(store.getThresholdsFor(id), values)
    const primary = values[0]?.value
    const ownUnit = inst.annotations[METRIC_ANN.unit]
    return {
      inst,
      id,
      subject: subjectLabel(inst.subject),
      unit,
      unitOverride: !!ownUnit && ownUnit !== metricUnit(props.metric),
      expression: metricExpression(inst.annotations),
      language: metricLanguage(inst.annotations),
      findings: findingsStore.findingCountFor(id),
      values,
      readings: values.map((value) => ({
        value,
        breached: thresholds.some((t) => evaluateThreshold(t, value.value) === 'breached'),
      })),
      primary,
      numeric: primary === undefined ? undefined : parseMetricNumber(primary),
      thresholds,
      thresholdRows: thresholds.map((threshold) => ({
        threshold,
        condition: formatThreshold(threshold, unit),
        breached: values.some((v) => evaluateThreshold(threshold, v.value) === 'breached'),
      })),
      status: store.statusByInstance.get(id) ?? 'no-reading',
    }
  }),
)

/** how many instances sit in each derived status (zero counts left out) */
const tally = computed(() => {
  const counts = new Map<InstanceStatus, number>()
  for (const r of rows.value) counts.set(r.status, (counts.get(r.status) ?? 0) + 1)
  return INSTANCE_STATUSES.filter((s) => counts.has(s)).map((s) => ({
    status: s,
    count: counts.get(s)!,
  }))
})

/**
 * Spread of the current values across the instances: lowest and highest
 * reading. Only when every reading is numeric and all instances with a
 * reading share one unit, so the two numbers are comparable.
 */
const range = computed(() => {
  let min: number | undefined
  let max: number | undefined
  let unit: string | undefined
  let first = true
  for (const r of rows.value) {
    if (r.values.length === 0) continue
    if (first) {
      unit = r.unit
      first = false
    } else if (r.unit !== unit) {
      return undefined
    }
    for (const v of r.values) {
      const n = parseMetricNumber(v.value)
      if (n === undefined) return undefined
      min = min === undefined ? n : Math.min(min, n)
      max = max === undefined ? n : Math.max(max, n)
    }
  }
  if (min === undefined || max === undefined) return undefined
  const numbers = min === max ? `${min}` : `${min} – ${max}`
  return unit ? `${numbers} ${unit}` : numbers
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) =>
    [
      r.inst.displayName,
      r.id,
      r.subject,
      ...r.values.map((v) => v.value),
      ...r.values.map((v) => v.displayName),
      ...r.thresholdRows.map((t) => t.condition),
      ...r.thresholds.map((t) => t.displayName),
    ].some((f) => (f ?? '').toLowerCase().includes(q)),
  )
})

function compare(a: Row, b: Row, key: SortKey): number {
  switch (key) {
    case 'name':
      return a.inst.displayName.localeCompare(b.inst.displayName)
    case 'subject':
      return a.subject.localeCompare(b.subject)
    case 'value': {
      // numbers first (numerically), then text, then no reading
      if (a.numeric !== undefined && b.numeric !== undefined) return a.numeric - b.numeric
      if (a.numeric !== undefined) return -1
      if (b.numeric !== undefined) return 1
      if (a.primary === undefined) return b.primary === undefined ? 0 : 1
      if (b.primary === undefined) return -1
      return a.primary.localeCompare(b.primary)
    }
    case 'thresholds':
      return a.thresholds.length - b.thresholds.length
    case 'status':
      return INSTANCE_STATUSES.indexOf(a.status) - INSTANCE_STATUSES.indexOf(b.status)
  }
}

const sorted = computed(() => {
  const dir = sortAsc.value ? 1 : -1
  return [...filtered.value].sort(
    (a, b) =>
      compare(a, b, sortKey.value) * dir ||
      a.inst.displayName.localeCompare(b.inst.displayName) ||
      a.id.localeCompare(b.id),
  )
})

watch(
  () => sorted.value.map((r) => r.id),
  (ids) => emit('update:orderedIds', ids),
  { immediate: true },
)

function sortBy(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    // numeric columns open descending so the largest readings lead
    sortAsc.value = key !== 'value' && key !== 'thresholds'
  }
}

function onRowKeydown(e: KeyboardEvent, id: string) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('select', id)
    return
  }
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.preventDefault()
  e.stopPropagation()
  const row = e.currentTarget as HTMLElement
  const next = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling
  if (next instanceof HTMLElement) next.focus()
}

function valuesTitle(r: Row): string {
  if (r.values.length === 0) return 'No current value reported'
  return r.values.map((v) => `${v.displayName}: ${v.value}${r.unit ? ` ${r.unit}` : ''}`).join('\n')
}

function thresholdsTitle(r: Row): string {
  if (r.thresholds.length === 0) return 'No thresholds'
  return r.thresholdRows
    .map(({ threshold, condition }) => {
      const lang = thresholdLanguage(threshold)
      return `${threshold.displayName}${condition ? `: ${condition}` : ''}${lang ? ` (${lang})` : ''}`
    })
    .join('\n')
}

function unitTitle(r: Row): string | undefined {
  if (!r.unitOverride) return undefined
  const base = metricUnit(props.metric)
  return base ? `Unit set on the instance (metric unit: ${base})` : 'Unit set on the instance'
}

function expressionTitle(r: Row): string | undefined {
  if (!r.expression) return undefined
  return r.language ? `${r.language}: ${r.expression}` : r.expression
}
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-3">
      <SectionLabel :count="instances.length">Metric instances</SectionLabel>
      <span class="flex min-w-0 shrink items-center gap-3">
        <span
          class="flex min-w-0 shrink items-center gap-3 font-mono text-micro text-text-4"
          title="Derived client-side from the current values and operator thresholds"
        >
          <span v-if="filtered.length !== instances.length">
            {{ filtered.length }} of {{ instances.length }} shown
          </span>
          <SkeletonBlock
            v-if="relatedLoading"
            class="h-3 w-28"
          />
          <template v-else>
            <span
              v-for="{ status, count } in tally"
              :key="status"
              class="whitespace-nowrap"
              :class="status === 'breached' ? 'text-warning' : ''"
              :title="INSTANCE_STATUS_TITLE[status]"
            >
              {{ count }} {{ INSTANCE_STATUS_LABEL[status] }}
            </span>
            <span
              v-if="range"
              class="whitespace-nowrap tabular-nums"
              title="Lowest and highest current value across the instances"
            >
              {{ range }}
            </span>
          </template>
        </span>
        <span
          v-if="showFilter"
          class="flex shrink-0 items-center gap-1.5 rounded bg-bg-2 px-2 py-1 transition-shadow focus-within:ring-1 focus-within:ring-border-2"
        >
          <IconSearch
            :size="12"
            :stroke-width="1.5"
            class="shrink-0 text-text-4"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Filter instances..."
            class="w-36 bg-transparent font-mono text-meta text-text-2 outline-none placeholder:text-text-4"
          />
        </span>
      </span>
    </div>

    <div class="overflow-x-auto">
      <table
        class="w-full table-fixed border-collapse text-data"
        :class="isResizing ? 'select-none' : ''"
        :style="tableStyle"
      >
        <colgroup>
          <col :style="{ width: `${INDICATOR_WIDTH}px` }" />
          <col
            v-for="col in COLUMNS"
            :key="col.key"
            :style="colStyle(col.key)"
          />
          <col :style="fillerStyle" />
        </colgroup>
        <thead>
          <tr class="border-b border-border-2">
            <th class="py-2 pl-1" />
            <th
              v-for="col in COLUMNS"
              :key="col.key"
              class="relative cursor-pointer select-none whitespace-nowrap py-2 font-medium text-text-3 transition-colors hover:text-text-1"
              :class="[col.align === 'right' ? 'text-right' : 'text-left', 'px-2']"
              :aria-sort="sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : undefined"
              @click="sortBy(col.key)"
            >
              <span class="inline-flex max-w-full items-center gap-1">
                <span class="truncate">{{ col.label }}</span>
                <component
                  :is="sortAsc ? IconArrowUp : IconArrowDown"
                  v-if="sortKey === col.key"
                  :size="12"
                  :stroke-width="2"
                  class="shrink-0"
                />
              </span>
              <span
                class="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize"
                :data-resize-handle="col.key"
                title="Drag to resize, double-click to reset"
                @mousedown.prevent.stop="onResizeStart(col.key, $event)"
                @click.stop
                @dblclick.stop="resetColumn(col.key)"
              >
                <span
                  class="absolute inset-y-1 left-1 w-0.5 transition-colors"
                  :class="isResizing ? 'bg-accent/60' : 'bg-transparent hover:bg-accent/40'"
                />
              </span>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in sorted"
            :key="r.id"
            :data-instance-row-id="r.id"
            tabindex="0"
            class="cursor-pointer border-b border-border-1 transition-colors last:border-b-0 focus-visible:bg-accent/10 focus-visible:outline-none"
            :class="r.id === activeInstanceId ? 'bg-bg-2' : 'hover:bg-bg-1'"
            title="Show instance details"
            @click="emit('select', r.id)"
            @keydown="onRowKeydown($event, r.id)"
          >
            <td class="py-2 pl-1">
              <IconLayoutSidebarRight
                v-if="r.id === activeInstanceId"
                :size="13"
                :stroke-width="1.75"
                class="text-text-3"
                aria-label="Shown in drawer"
              />
              <span
                v-else-if="r.status === 'breached'"
                class="block h-1.5 w-1.5 rounded-full bg-warning"
                aria-hidden="true"
              />
            </td>
            <td class="px-2 py-2">
              <div class="flex min-w-0 items-center gap-1.5">
                <span
                  class="min-w-0 truncate font-medium text-text-1"
                  :title="r.inst.displayName"
                >
                  {{ r.inst.displayName }}
                </span>
                <IconMathFunction
                  v-if="r.expression"
                  :size="13"
                  :stroke-width="1.75"
                  class="shrink-0 text-text-4"
                  :title="expressionTitle(r)"
                  aria-label="Has an expression"
                />
                <FindingsBadge :count="r.findings" />
              </div>
              <div
                v-if="r.inst.description"
                class="truncate text-meta text-text-4"
                :title="r.inst.description"
              >
                {{ r.inst.description }}
              </div>
            </td>
            <td class="px-2 py-2">
              <component
                :is="subjectNavTarget(r.inst.subject) ? 'button' : 'span'"
                v-if="r.inst.subject"
                :type="subjectNavTarget(r.inst.subject) ? 'button' : undefined"
                class="group/subject flex min-w-0 max-w-full items-center gap-1.5 text-left"
                :title="subjectTitle(r.inst.subject)"
                @click.stop="goToSubject(r.inst.subject)"
              >
                <SubjectGlyph :type="r.inst.subject.resourceType" />
                <span
                  class="truncate font-mono text-meta text-text-3 transition-colors"
                  :class="subjectNavTarget(r.inst.subject) ? 'group-hover/subject:text-accent' : ''"
                >
                  {{ r.subject }}
                </span>
                <IconArrowUpRight
                  v-if="subjectNavTarget(r.inst.subject)"
                  :size="12"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 opacity-0 transition-opacity group-hover/subject:opacity-100"
                />
              </component>
              <span
                v-else
                class="font-mono text-meta text-text-4"
              >
                —
              </span>
            </td>
            <td
              class="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums"
              :title="valuesTitle(r)"
            >
              <SkeletonBlock
                v-if="relatedLoading && r.values.length === 0"
                class="ml-auto h-4 w-16"
              />
              <template v-else-if="r.readings.length > 0">
                <span
                  v-for="{ value, breached } in r.readings"
                  :key="value.metricValueId"
                  class="block"
                >
                  <span
                    class="text-body font-medium"
                    :class="breached ? 'text-warning' : 'text-text-1'"
                  >
                    {{ value.value }}
                  </span>
                  <span
                    v-if="r.unit"
                    class="ml-1 text-meta text-text-3"
                    :class="r.unitOverride ? 'underline decoration-dotted underline-offset-2' : ''"
                    :title="unitTitle(r)"
                  >
                    {{ r.unit }}
                  </span>
                  <span
                    v-if="r.readings.length > 1"
                    class="block truncate text-micro text-text-4"
                    :title="value.displayName"
                  >
                    {{ value.displayName }}
                  </span>
                </span>
              </template>
              <span
                v-else
                class="text-meta text-text-4"
              >
                —
              </span>
            </td>
            <td
              class="px-2 py-2 font-mono text-meta"
              :title="thresholdsTitle(r)"
            >
              <SkeletonBlock
                v-if="relatedLoading && r.thresholds.length === 0"
                class="h-4 w-20"
              />
              <template v-else-if="r.thresholdRows.length > 0">
                <span
                  v-for="{ threshold, condition, breached } in r.thresholdRows.slice(
                    0,
                    MAX_THRESHOLDS,
                  )"
                  :key="threshold.thresholdId"
                  class="block"
                >
                  <span
                    class="block truncate"
                    :class="breached ? 'text-warning' : 'text-text-2'"
                  >
                    {{ condition ?? 'No condition declared' }}
                  </span>
                  <span
                    class="line-clamp-2 break-words text-micro leading-snug text-text-4"
                    :title="threshold.displayName"
                  >
                    {{ threshold.displayName }}
                  </span>
                </span>
                <span
                  v-if="r.thresholdRows.length > MAX_THRESHOLDS"
                  class="block text-micro text-text-4"
                >
                  +{{ r.thresholdRows.length - MAX_THRESHOLDS }} more
                </span>
              </template>
              <span
                v-else
                class="text-text-4"
              >
                —
              </span>
            </td>
            <td class="whitespace-nowrap px-2 py-2">
              <SkeletonBlock
                v-if="relatedLoading && r.values.length === 0"
                class="h-4 w-16"
              />
              <TypeTag
                v-else
                :tone="STATUS_TONE[r.status]"
                :title="INSTANCE_STATUS_TITLE[r.status]"
                :class="r.status === 'unknown' || r.status === 'no-reading' ? 'text-text-4' : ''"
              >
                {{ INSTANCE_STATUS_LABEL[r.status] }}
              </TypeTag>
            </td>
            <td />
          </tr>
        </tbody>
      </table>
      <p
        v-if="sorted.length === 0"
        class="py-2 text-meta text-text-4"
      >
        No instances match the filter.
      </p>
    </div>
  </div>
</template>
