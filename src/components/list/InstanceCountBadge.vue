<script setup lang="ts">
import { computed } from 'vue'
import { pluralize } from '@/utils/text'

const props = withDefaults(defineProps<{ count: number; noun?: string }>(), { noun: 'instance' })
const title = computed(() => pluralize(props.count, props.noun))
</script>

<template>
  <span
    v-if="count > 0"
    class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
    :title="title"
  >
    <svg
      width="14"
      height="9"
      viewBox="0 0 14 9"
      class="shrink-0"
      aria-hidden="true"
    >
      <polygon
        points="0,0 10,0 14,4 14,9 0,9"
        fill="var(--color-text-3)"
      />
    </svg>
    {{ count }}
  </span>
</template>
