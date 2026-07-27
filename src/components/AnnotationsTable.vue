<script setup lang="ts">
/**
 * Renders a resource's annotations as a key/value grid. The key column width
 * is configurable so it fits both wide detail panes and narrower drawers
 *
 *   <AnnotationsTable :annotations="system.annotations" />
 *   <AnnotationsTable :annotations="inst.annotations" columns="minmax(180px, 30%) minmax(0, 1fr)" />
 *   <AnnotationsTable :annotations="system.annotations" layout="stacked" />
 */
withDefaults(
  defineProps<{
    annotations: Record<string, string>
    columns?: string
    layout?: 'columns' | 'stacked'
  }>(),
  {
    columns: 'minmax(200px, 35%) minmax(0, 1fr)',
    layout: 'columns',
  },
)

function splitKey(key: string): { prefix: string; name: string } {
  const at = key.lastIndexOf('/')
  return at === -1
    ? { prefix: '', name: key }
    : { prefix: key.slice(0, at + 1), name: key.slice(at + 1) }
}
</script>

<template>
  <template v-if="layout === 'stacked'">
    <div
      v-for="(value, key) in annotations"
      :key="key"
      class="flex flex-col gap-0.5 border-b border-border-1 py-2 last:border-b-0"
    >
      <span
        class="truncate font-mono text-meta"
        :title="key"
      >
        <span class="text-text-4">{{ splitKey(key).prefix }}</span>
        <span class="font-semibold text-text-3">{{ splitKey(key).name }}</span>
      </span>
      <span class="break-words text-data leading-snug text-text-2">{{ value }}</span>
    </div>
  </template>

  <template v-else>
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
</template>
