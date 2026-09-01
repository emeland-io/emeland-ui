<script setup lang="ts">
/**
 * Wrapper around a layout skeleton while loading
 */
defineProps<{
  label?: string
}>()
</script>

<template>
  <div
    role="status"
    :aria-label="label"
    class="skeleton-appear flex flex-1 flex-col overflow-hidden"
  >
    <slot />
  </div>
</template>
