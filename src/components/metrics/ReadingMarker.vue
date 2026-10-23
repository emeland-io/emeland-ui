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
    size?: 'sm' | 'md'
  }>(),
  { numbered: false, size: 'md' },
)
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center rounded-full font-mono font-semibold leading-none text-bg-0"
    :class="[
      breached ? 'bg-warning' : 'bg-text-2',
      size === 'sm' ? 'h-2.5 w-2.5 text-[8px]' : 'h-3.5 w-3.5 text-[9px]',
    ]"
    aria-hidden="true"
  >
    <template v-if="numbered">{{ index }}</template>
  </span>
</template>
