<script setup lang="ts">
/**
 * All instances of a metric on one shared scale. a marker per instance at
 * its current reading, breached ones in warning colour. Thresholds differ
 * per instance, so there are no bands, hover names the instance, click
 * opens it.
 *
 * Renders nothing with fewer than two points: a single marker says nothing
 * about the spread.
 */
import { computed, ref } from 'vue'
import ReadingMarker from '@/components/metrics/ReadingMarker.vue'
import { formatScaleNumber, scaleDomain, scalePosition } from '@/utils/scale'
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
  }>(),
  { unit: undefined, activeId: '' },
)

const emit = defineEmits<{
  select: [id: string]
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
  const byLimit = new Map<number, string[]>()
  for (const p of props.points) {
    for (const l of p.limits) {
      const lines = byLimit.get(l.limit) ?? []
      const line = `${p.name}: ${l.label}`
      if (!lines.includes(line)) lines.push(line)
      byLimit.set(l.limit, lines)
    }
  }
  return [...byLimit.entries()]
    .sort(([a], [b]) => a - b)
    .map(([limit, lines]) => ({ limit, title: lines.join('\n') }))
})

/** instance whose own limits are shown as bands */
const hoveredId = ref('')
const bands = computed(() => props.points.find((p) => p.id === hoveredId.value)?.limits ?? [])

function bandStyle(l: ThresholdLimit): Record<string, string> {
  return l.side === 'above'
    ? { left: `${x(l.limit)}%`, right: '0' }
    : { left: '0', right: `${100 - x(l.limit)}%` }
}

const ordered = computed(() =>
  [...props.points].sort((a, b) => Number(a.breached) - Number(b.breached)),
)

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
          class="absolute inset-y-0 w-px bg-warning/50"
          :style="{ left: `${x(t.limit)}%` }"
          :title="t.title"
        />
      </div>
      <button
        v-for="p in ordered"
        :key="p.id"
        type="button"
        data-strip-marker
        class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-shadow hover:ring-accent/60 focus-visible:ring-accent focus-visible:outline-none"
        :class="p.id === activeId ? 'ring-accent' : 'ring-bg-0'"
        :style="{ left: `${x(p.n)}%` }"
        :title="title(p)"
        :aria-label="title(p)"
        @click.stop="emit('select', p.id)"
        @mouseenter="hoveredId = p.id"
        @mouseleave="hoveredId = ''"
        @focus="hoveredId = p.id"
        @blur="hoveredId = ''"
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
