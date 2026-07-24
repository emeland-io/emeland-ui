<script setup lang="ts">
/**
 * Renders a resource's annotations as a key/value grid. The key column width
 * is configurable so it fits both wide detail panes and narrower drawers
 *
 *   <AnnotationsTable :annotations="system.annotations" />
 *   <AnnotationsTable :annotations="inst.annotations" columns="minmax(180px, 30%) minmax(0, 1fr)" />
 */
withDefaults(defineProps<{ annotations: Record<string, string>; columns?: string }>(), {
  columns: 'minmax(200px, 35%) minmax(0, 1fr)',
})
</script>

<template>
  <div
    v-for="(value, key) in annotations"
    :key="key"
    class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
    :style="{ gridTemplateColumns: columns }"
  >
    <span
      class="truncate text-text-3"
      :title="key"
    >
      {{ key }}
    </span>
    <span class="break-all text-text-2">{{ value }}</span>
  </div>
</template>
