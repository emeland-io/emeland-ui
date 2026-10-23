<script setup lang="ts">
/**
 * Puts the current readings of a metric instance and its operator thresholds
 * on one horizontal scale: a track with a warning band on the breaching side
 * of each limit, a tick at the limit and a marker per reading.
 *
 * Renders nothing unless there is at least one numeric reading and one
 * numeric comparison threshold (gt/ge/lt/le), otherwise there is nothing to
 * relate.
 */
import { computed } from 'vue'
import { evaluateThreshold, parseMetricNumber, thresholdLimits } from '@/types/metric'
import type { MetricValue, Threshold, ThresholdLimit } from '@/types/metric'
import ReadingMarker from '@/components/metrics/ReadingMarker.vue'
import { formatScaleNumber, scaleDomain, scalePosition } from '@/utils/scale'

const props = defineProps<{
  values: MetricValue[]
  thresholds: Threshold[]
  unit?: string
}>()

interface Reading {
  value: MetricValue
  /** 1-based position among all readings, numeric or not, so it matches the list */
  index: number
  n: number
  breached: boolean
}

/** how close two ticks may sit (in % of the width) before their labels stack */
const LABEL_SPACING = 18

const limits = computed(() => thresholdLimits(props.thresholds, props.unit))

const readings = computed<Reading[]>(() =>
  props.values.flatMap((value, i) => {
    const n = parseMetricNumber(value.value)
    if (n === undefined) return []
    return [
      {
        value,
        index: i + 1,
        n,
        breached: props.thresholds.some((t) => evaluateThreshold(t, value.value) === 'breached'),
      },
    ]
  }),
)

const visible = computed(() => limits.value.length > 0 && readings.value.length > 0)

const domain = computed(() =>
  scaleDomain([...limits.value.map((l) => l.limit), ...readings.value.map((r) => r.n)], props.unit),
)

function x(n: number): number {
  return scalePosition(n, domain.value)
}

/** band from the limit to the breaching edge */
function bandStyle(l: ThresholdLimit): Record<string, string> {
  return l.side === 'above'
    ? { left: `${x(l.limit)}%`, right: '0' }
    : { left: '0', right: `${100 - x(l.limit)}%` }
}

/** label rows: a label drops to the next line when it would overlap the previous one */
const labels = computed(() =>
  limits.value.map((l, i) => ({
    ...l,
    row: i > 0 && x(l.limit) - x(limits.value[i - 1]!.limit) < LABEL_SPACING ? 1 : 0,
  })),
)

const labelRows = computed(() => (labels.value.some((l) => l.row === 1) ? 2 : 1))

function labelStyle(l: { limit: number }): Record<string, string> {
  const pos = x(l.limit)
  // labels grow inwards from their tick so they never leave the track
  return pos <= 50 ? { left: `${pos}%` } : { right: `${100 - pos}%` }
}

function readingTitle(r: Reading): string {
  return `${r.value.displayName}: ${r.value.value}${props.unit ? ` ${props.unit}` : ''}`
}

function limitTitle(l: ThresholdLimit): string {
  return `${l.threshold.displayName}: ${l.label}`
}
</script>

<template>
  <div
    v-if="visible"
    class="mt-3"
    role="img"
    aria-label="Current values against thresholds"
  >
    <div class="flex items-start gap-2 font-mono text-micro leading-none text-text-4">
      <span class="flex h-2.5 shrink-0 items-center tabular-nums">
        {{ formatScaleNumber(domain.lo) }}
      </span>
      <div class="min-w-0 flex-1">
        <div class="relative h-2.5 rounded-full bg-bg-3">
          <div class="absolute inset-0 overflow-hidden rounded-full">
            <span
              v-for="l in limits"
              :key="`band-${l.threshold.thresholdId}`"
              class="absolute inset-y-0 bg-warning/15"
              :style="bandStyle(l)"
              :title="limitTitle(l)"
            />
            <span
              v-for="l in limits"
              :key="`tick-${l.threshold.thresholdId}`"
              class="absolute inset-y-0 w-px bg-warning/60"
              :style="{ left: `${x(l.limit)}%` }"
              :title="limitTitle(l)"
            />
          </div>
          <ReadingMarker
            v-for="r in readings"
            :key="r.value.metricValueId"
            data-reading-marker
            class="absolute -top-0.5 -translate-x-1/2 ring-2 ring-bg-0"
            :index="r.index"
            :breached="r.breached"
            :numbered="values.length > 1"
            :style="{ left: `${x(r.n)}%` }"
            :title="readingTitle(r)"
          />
        </div>
        <!-- limit labels under their ticks, stacked when they would collide -->
        <div
          class="relative mt-1.5"
          :style="{ height: `${labelRows * 0.875}rem` }"
        >
          <span
            v-for="l in labels"
            :key="`label-${l.threshold.thresholdId}`"
            data-limit-label
            class="absolute whitespace-nowrap text-warning/80"
            :style="{ ...labelStyle(l), top: l.row === 1 ? '0.875rem' : '0' }"
            :title="l.threshold.displayName"
          >
            {{ l.label }}
          </span>
        </div>
      </div>
      <span class="flex h-2.5 shrink-0 items-center whitespace-nowrap tabular-nums">
        {{ formatScaleNumber(domain.hi) }}{{ unit ? ` ${unit}` : '' }}
      </span>
    </div>
  </div>
</template>
