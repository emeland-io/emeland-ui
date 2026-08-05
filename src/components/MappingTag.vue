<script setup lang="ts">
/**
 * Small state badge for instances whose parent reference is broken, styled
 * after the kind tags (e.g. "Abstract" in the systems list). Renders nothing
 * when the parent resolves fine.
 *
 *   <MappingTag :state="mappingStateOf(inst.api, apiMap.has(inst.api ?? ''))" />
 */
import type { MappingState } from '@/utils/mapping'

defineProps<{ state?: MappingState }>()
</script>

<template>
  <span
    v-if="state"
    class="shrink-0 rounded px-1.5 py-0.5 font-mono text-meta"
    :class="state === 'unmapped' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'"
    :title="
      state === 'unmapped'
        ? 'Not mapped to a parent resource'
        : 'References a parent resource that does not exist'
    "
  >
    {{ state }}
  </span>
</template>
