<script setup lang="ts">
/**
 * All instances of a metric on one shared scale: a marker per instance at
 * its current reading, breached ones in warning colour, and a faint tick for
 * every distinct limit. Thresholds differ per instance, so bands only appear
 * for the highlighted instance, whose marker and ticks stand out while the
 * rest dims. Highlighting is owned by the parent (`highlightId`), so a table
 * row and its marker can light up together.
 *
 * Renders nothing with fewer than two points: a single marker says nothing
 * about the spread.
 */
import { computed } from 'vue'
import ReadingMarker from '@/components/metrics/ReadingMarker.vue'
import { formatScaleNumber, scaleDomain, scalePosition } from '@/utils/scale'
import { evaluateThreshold } from '@/types/metric'
import type { ThresholdLimit } from '@/types/metric'

export interface StripPoint {
  id: string
  name: string
  value: string
  n: number
  breached: boolean
  limits: ThresholdLimit[]
}

const props = withDefaults(
  defineProps<{
    points: StripPoint[]
    unit?: string
    activeId?: string
    highlightId?: string
  }>(),
  { unit: undefined, activeId: '', highlightId: '' },
)

const emit = defineEmits<{
  select: [id: string]
  highlight: [id: string]
}>()

const visible = computed(() => props.points.length > 1)

const domain = computed(() =>
  scaleDomain(
    props.points.flatMap((p) => [p.n, ...p.limits.map((l) => l.limit)]),
    props.unit,
  ),
)

function x(n: number): number {
  return scalePosition(n, domain.value)
}

/** one tick per distinct limit value, naming every instance and threshold at it */
const ticks = computed(() => {
  const byLimit = new Map<number, { lines: string[]; ids: Set<string> }>()
  for (const p of props.points) {
    for (const l of p.limits) {
      const tick = byLimit.get(l.limit) ?? { lines: [], ids: new Set<string>() }
      const line = `${p.name}: ${l.label}`
      if (!tick.lines.includes(line)) tick.lines.push(line)
      tick.ids.add(p.id)
      byLimit.set(l.limit, tick)
    }
  }
  return [...byLimit.entries()]
    .sort(([a], [b]) => a - b)
    .map(([limit, { lines, ids }]) => ({ limit, title: lines.join('\n'), ids }))
})

const highlighted = computed(() => props.points.find((p) => p.id === props.highlightId))

const bands = computed(() => highlighted.value?.limits ?? [])

// highlighted marker last so it paints on top, otherwise breached ones on top
const ordered = computed(() =>
  [...props.points].sort(
    (a, b) =>
      Number(a.id === props.highlightId) - Number(b.id === props.highlightId) ||
      Number(a.breached) - Number(b.breached),
  ),
)

function bandStyle(l: ThresholdLimit): Record<string, string> {
  return l.side === 'above'
    ? { left: `${x(l.limit)}%`, right: '0' }
    : { left: '0', right: `${100 - x(l.limit)}%` }
}

function linkStyle(p: StripPoint, l: ThresholdLimit): Record<string, string> {
  const a = x(p.n)
  const b = x(l.limit)
  return { left: `${Math.min(a, b)}%`, width: `${Math.abs(a - b)}%` }
}

function linkClass(p: StripPoint, l: ThresholdLimit): string {
  return evaluateThreshold(l.threshold, p.value) === 'breached'
    ? 'border-solid border-warning'
    : 'border-dashed border-warning/70'
}

function tickClass(tick: { ids: Set<string> }): string {
  if (!highlighted.value) return 'bg-warning/50'
  return tick.ids.has(highlighted.value.id) ? 'bg-warning' : 'bg-warning/15'
}

function markerClass(p: StripPoint): string {
  if (p.id === props.activeId) return 'ring-accent'
  if (!highlighted.value) return 'ring-bg-0'
  return p.id === highlighted.value.id ? 'ring-accent/60' : 'ring-bg-0 opacity-30'
}

function title(p: StripPoint): string {
  return `${p.name}: ${p.value}${props.unit ? ` ${props.unit}` : ''}`
}
</script>

<template>
  <div
    v-if="visible"
    data-instance-strip
    aria-label="Instances on one scale"
    class="flex items-center gap-2 font-mono text-micro leading-none text-text-4"
  >
    <span class="shrink-0 tabular-nums">{{ formatScaleNumber(domain.lo) }}</span>
    <div class="relative h-1.5 flex-1 rounded-full bg-bg-3">
      <div class="absolute inset-0 overflow-hidden rounded-full">
        <span
          v-for="l in bands"
          :key="`band-${l.threshold.thresholdId}`"
          data-strip-band
          class="absolute inset-y-0 bg-warning/25"
          :style="bandStyle(l)"
          :title="`${l.label} ${l.threshold.displayName}`"
        />
        <span
          v-for="t in ticks"
          :key="`tick-${t.limit}`"
          data-strip-tick
          class="absolute inset-y-0 w-px transition-colors"
          :class="tickClass(t)"
          :style="{ left: `${x(t.limit)}%` }"
          :title="t.title"
        />
      </div>
      <template v-if="highlighted">
        <span
          v-for="l in bands"
          :key="`link-${l.threshold.thresholdId}`"
          data-strip-link
          class="absolute top-1/2 h-0 -translate-y-1/2 border-t-2"
          :class="linkClass(highlighted, l)"
          :style="linkStyle(highlighted, l)"
        />
        <span
          v-for="l in bands"
          :key="`cap-${l.threshold.thresholdId}`"
          data-strip-cap
          class="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-warning"
          :style="{ left: `${x(l.limit)}%` }"
          :title="`${l.label} ${l.threshold.displayName}`"
        />
      </template>
      <button
        v-for="p in ordered"
        :key="p.id"
        type="button"
        data-strip-marker
        class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-[opacity,box-shadow] focus-visible:ring-accent focus-visible:outline-none"
        :class="markerClass(p)"
        :style="{ left: `${x(p.n)}%` }"
        :title="title(p)"
        :aria-label="title(p)"
        @click.stop="emit('select', p.id)"
        @mouseenter="emit('highlight', p.id)"
        @mouseleave="emit('highlight', '')"
        @focus="emit('highlight', p.id)"
        @blur="emit('highlight', '')"
      >
        <ReadingMarker
          :index="0"
          :breached="p.breached"
          size="sm"
        />
      </button>
    </div>
    <span class="shrink-0 tabular-nums">
      {{ formatScaleNumber(domain.hi) }}{{ unit ? ` ${unit}` : '' }}
    </span>
  </div>
</template>
