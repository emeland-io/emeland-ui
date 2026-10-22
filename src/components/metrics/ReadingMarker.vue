<script setup lang="ts">
/**
 * The dot that stands for one reading, both on the value scale and in front
 * of the reading in a list, so the two can be matched. Carries the reading's
 * number when the instance has more than one reading.
 */
withDefaults(
  defineProps<{
    index: number
    breached: boolean
    numbered?: boolean
  }>(),
  { numbered: false },
)
</script>

<template>
  <span
    class="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-semibold leading-none text-bg-0"
    :class="breached ? 'bg-warning' : 'bg-text-2'"
    aria-hidden="true"
  >
    <template v-if="numbered">{{ index }}</template>
  </span>
</template>
