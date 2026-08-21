<script setup lang="ts">
import { IconArrowsExchange } from '@tabler/icons-vue'
import TypeGlyph from '@/components/TypeGlyph.vue'
import type { ResourceType } from '@/types/common'

/**
 * - rect: node drawn as a (rounded) rectangle; pass `rx: 5` for the pill shape
 * - pentagon: node drawn as the clipped-corner shape; outlined when `stroke` is set
 * - arrow: edge marker, dashed for "consumes"-style relations
 * - chip: a TypeGlyph label prefix (e.g. System, Context)
 * - crossing: the boundary-crossing icon
 */
export type LegendSwatch =
  | { shape: 'rect'; fill?: string; stroke?: string; dash?: string; rx?: number }
  | { shape: 'pentagon'; fill: string; stroke?: string }
  | { shape: 'arrow'; dashed?: boolean }
  | { shape: 'chip'; type: ResourceType }
  | { shape: 'crossing' }

export interface LegendItem {
  swatch: LegendSwatch
  label: string
}

defineProps<{
  /** items grouped into vertical columns, rendered left to right */
  columns: LegendItem[][]
}>()
</script>

<template>
  <div
    class="absolute right-3 top-3 z-10 flex gap-4 rounded border border-border-1 bg-bg-1/90 px-2.5 py-2 font-mono text-micro text-text-4 opacity-50 transition-opacity hover:opacity-100"
  >
    <div
      v-for="(column, ci) in columns"
      :key="ci"
      class="flex flex-col gap-1"
    >
      <div
        v-for="item in column"
        :key="item.label"
        class="flex items-center gap-1.5"
      >
        <svg
          v-if="item.swatch.shape === 'rect'"
          width="18"
          height="11"
          viewBox="0 0 18 11"
          class="shrink-0"
          aria-hidden="true"
        >
          <rect
            x="0.5"
            y="0.5"
            width="17"
            height="10"
            :rx="item.swatch.rx ?? 2"
            :fill="item.swatch.fill ?? 'none'"
            :stroke="item.swatch.stroke"
            :stroke-dasharray="item.swatch.dash"
          />
        </svg>
        <svg
          v-else-if="item.swatch.shape === 'pentagon'"
          width="18"
          height="11"
          viewBox="0 0 18 11"
          class="shrink-0"
          aria-hidden="true"
        >
          <polygon
            :points="
              item.swatch.stroke
                ? '0.5,0.5 12.5,0.5 17.5,5 17.5,10.5 0.5,10.5'
                : '0,0 13,0 18,5 18,11 0,11'
            "
            :fill="item.swatch.fill"
            :stroke="item.swatch.stroke"
          />
        </svg>
        <svg
          v-else-if="item.swatch.shape === 'arrow'"
          width="20"
          height="8"
          viewBox="0 0 20 8"
          class="shrink-0"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="4"
            x2="13"
            y2="4"
            stroke="var(--color-text-3)"
            stroke-width="1.25"
            :stroke-dasharray="item.swatch.dashed ? '3 2.5' : undefined"
          />
          <path
            d="M13 1.4 L19 4 L13 6.6 Z"
            fill="var(--color-text-3)"
          />
        </svg>
        <TypeGlyph
          v-else-if="item.swatch.shape === 'chip'"
          :type="item.swatch.type"
        />
        <IconArrowsExchange
          v-else-if="item.swatch.shape === 'crossing'"
          :size="11"
          :stroke-width="2"
          class="shrink-0 text-text-3"
        />
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
