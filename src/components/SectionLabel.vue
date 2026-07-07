<script setup lang="ts">
/**
 * Small uppercase section heading used throughout detail panes
 * Renders its slot as the label and an optional muted count in parentheses
 *
 *   <SectionLabel>Annotations</SectionLabel>
 *   <SectionLabel :count="items.length">Instances</SectionLabel>
 */
defineProps<{ count?: number }>()
</script>

<template>
  <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
    <slot />
    <span
      v-if="count !== undefined"
      class="ml-1 font-mono text-text-4"
    >
      ({{ count }})
    </span>
  </div>
</template>
