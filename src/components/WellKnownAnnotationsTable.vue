<script setup lang="ts">
/**
 * Renders the well-known annotations of a resource as a labelled
 * key/value grid. The set of recognized annotations is the
 * WELL_KNOWN_ANNOTATIONS catalog in `utils/annotations`; extend it there.
 *
 * Renders nothing when the resource carries none of them.
 *
 *   <WellKnownAnnotationsTable :annotations="inst.annotations" />
 *   <WellKnownAnnotationsTable :annotations="inst.annotations" columns="minmax(160px, 30%) minmax(0, 1fr)" />
 */
import { computed } from 'vue'
import { wellKnownAnnotations } from '@/utils/annotations'
import type { Annotations } from '@/types/common'

const props = withDefaults(defineProps<{ annotations: Annotations; columns?: string }>(), {
  columns: 'minmax(180px, 30%) minmax(0, 1fr)',
})

const rows = computed(() => wellKnownAnnotations(props.annotations))
</script>

<template>
  <div
    v-for="row in rows"
    :key="row.key"
    class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
    :style="{ gridTemplateColumns: columns }"
  >
    <span class="text-text-3">{{ row.label }}</span>
    <span class="break-all text-text-2">{{ row.value }}</span>
  </div>
</template>