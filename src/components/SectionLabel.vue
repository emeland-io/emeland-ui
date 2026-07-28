<script setup lang="ts">
/**
 * Small uppercase section heading used throughout detail panes
 * Renders its slot as the label and an optional muted count in parentheses
 *
 *   <SectionLabel>Annotations</SectionLabel>
 *   <SectionLabel :count="items.length">Instances</SectionLabel>
 *   <SectionLabel :count="findings.length" tone="warning">Findings</SectionLabel>
 *
 */
withDefaults(defineProps<{ count?: number; tone?: 'neutral' | 'warning' }>(), {
  count: undefined,
  tone: 'neutral',
})
</script>

<template>
  <div
    class="mb-3 flex items-center gap-2 text-meta font-semibold uppercase tracking-widest text-text-4"
  >
    <slot />
    <span
      v-if="count !== undefined"
      class="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-micro tabular-nums"
      :class="
        tone === 'warning' && count > 0
          ? 'border border-warning/20 bg-warning/10 text-warning'
          : 'bg-bg-3 text-text-3'
      "
    >
      {{ count }}
    </span>
  </div>
</template>
