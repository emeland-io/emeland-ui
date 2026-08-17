import type { LegendSwatch } from './GraphLegend.vue'

export const API_PILL: LegendSwatch = {
  shape: 'rect',
  rx: 5,
  fill: 'var(--color-bg-1)',
  stroke: 'var(--color-border-2)',
}

export const COMPONENT_PENTAGON: LegendSwatch = {
  shape: 'pentagon',
  fill: 'var(--color-bg-2)',
  stroke: 'var(--color-border-2)',
}

export const INSTANCE_PENTAGON: LegendSwatch = {
  shape: 'pentagon',
  fill: 'var(--color-bg-3)',
}

export const UNMAPPED_RECT: LegendSwatch = {
  shape: 'rect',
  fill: 'none',
  stroke: 'var(--color-text-3)',
  dash: '2.5 2',
}
