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
import {
  evaluateThreshold,
  formatThreshold,
  parseMetricNumber,
  thresholdCondition,
} from '@/types/metric'
import type { MetricValue, Threshold } from '@/types/metric'

const props = defineProps<{
  values: MetricValue[]
  thresholds: Threshold[]
  unit?: string
}>()

type Side = 'above' | 'below'

interface Limit {
  threshold: Threshold
  limit: number
  /** which side of the limit counts as a breach */
  side: Side
  label: string
}

interface Reading {
  value: MetricValue
  n: number
  breached: boolean
}

/** how close two ticks may sit (in % of the width) before their labels stack */
const LABEL_SPACING = 12

const limits = computed<Limit[]>(() => {
  const out: Limit[] = []
  for (const t of props.thresholds) {
    const c = thresholdCondition(t)
    if (!c || c.kind !== 'operator') continue
    const side: Side | undefined =
      c.operator === 'gt' || c.operator === 'ge'
        ? 'above'
        : c.operator === 'lt' || c.operator === 'le'
          ? 'below'
          : undefined
    if (!side) continue
    const limit = parseMetricNumber(c.limit)
    if (limit === undefined) continue
    out.push({ threshold: t, limit, side, label: formatThreshold(t, props.unit) ?? `${limit}` })
  }
  return out.sort((a, b) => a.limit - b.limit)
})

const readings = computed<Reading[]>(() =>
  props.values.flatMap((value) => {
    const n = parseMetricNumber(value.value)
    if (n === undefined) return []
    return [
      {
        value,
        n,
        breached: props.thresholds.some((t) => evaluateThreshold(t, value.value) === 'breached'),
      },
    ]
  }),
)

const visible = computed(() => limits.value.length > 0 && readings.value.length > 0)

const domain = computed(() => {
  const numbers = [...limits.value.map((l) => l.limit), ...readings.value.map((r) => r.n)]
  const lo = Math.min(0, ...numbers)
  let hi = Math.max(...numbers)
  if (props.unit === '%' && hi <= 100) hi = 100
  else hi += (hi - lo) * 0.1
  if (numbers.every(Number.isInteger)) hi = Math.ceil(hi)
  if (hi === lo) hi = lo + 1
  return { lo, hi }
})

function x(n: number): number {
  const { lo, hi } = domain.value
  return Math.min(100, Math.max(0, ((n - lo) / (hi - lo)) * 100))
}

/** band from the limit to the breaching edge */
function bandStyle(l: Limit): Record<string, string> {
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

const EDGE = 8
const showLo = computed(() => !labels.value.some((l) => l.row === 0 && x(l.limit) < EDGE))
const showHi = computed(() => !labels.value.some((l) => l.row === 0 && x(l.limit) > 100 - EDGE))

function labelStyle(l: { limit: number }): Record<string, string> {
  const pos = x(l.limit)
  // keep edge labels inside the track instead of centring them past it
  if (pos < EDGE) return { left: '0' }
  if (pos > 100 - EDGE) return { right: '0' }
  return { left: `${pos}%`, transform: 'translateX(-50%)' }
}

function fmt(n: number): string {
  return Number.isInteger(n) ? `${n}` : `${Number(n.toPrecision(3))}`
}

function readingTitle(r: Reading): string {
  return `${r.value.displayName}: ${r.value.value}${props.unit ? ` ${props.unit}` : ''}`
}

function limitTitle(l: Limit): string {
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
      <span
        v-for="r in readings"
        :key="r.value.metricValueId"
        data-reading-marker
        class="absolute -top-0.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-2 ring-bg-0"
        :class="r.breached ? 'bg-warning' : 'bg-text-2'"
        :style="{ left: `${x(r.n)}%` }"
        :title="readingTitle(r)"
      />
    </div>
    <div
      class="relative mt-1.5 font-mono text-micro leading-none text-text-4"
      :style="{ height: `${labelRows * 0.875}rem` }"
    >
      <span
        v-if="showLo"
        class="absolute left-0 top-0 tabular-nums"
      >
        {{ fmt(domain.lo) }}
      </span>
      <span
        v-if="showHi"
        class="absolute right-0 top-0 tabular-nums"
      >
        {{ fmt(domain.hi) }}
      </span>
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
</template>
