<script setup lang="ts">
defineProps<{
  count: number
  title: string
}>()
</script>

<template>
  <span
    v-if="count > 0"
    class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
    :title="title"
  >
    <svg
      width="13"
      height="10"
      viewBox="0 0 13 10"
      class="shrink-0"
      aria-hidden="true"
    >
      <polygon
        points="0,0 9,0 13,3 13,4 0,4"
        fill="var(--color-text-3)"
      />
      <polygon
        points="0,6 9,6 13,9 13,10 0,10"
        fill="var(--color-text-3)"
        opacity="0.6"
      />
    </svg>
    {{ count }}
  </span>
</template>
