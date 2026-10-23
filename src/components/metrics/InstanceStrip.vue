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
import { computed } from 'vue'
import ReadingMarker from '@/components/metrics/ReadingMarker.vue'
import { formatScaleNumber, scaleDomain, scalePosition } from '@/utils/scale'

export interface StripPoint {
  id: string
  name: string
  value: string
  n: number
  breached: boolean
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
    props.points.map((p) => p.n),
    props.unit,
  ),
)

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
      <button
        v-for="p in ordered"
        :key="p.id"
        type="button"
        data-strip-marker
        class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-shadow hover:ring-accent/60 focus-visible:ring-accent focus-visible:outline-none"
        :class="p.id === activeId ? 'ring-accent' : 'ring-bg-0'"
        :style="{ left: `${scalePosition(p.n, domain)}%` }"
        :title="title(p)"
        :aria-label="title(p)"
        @click.stop="emit('select', p.id)"
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
