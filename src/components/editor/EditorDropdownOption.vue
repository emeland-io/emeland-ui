<script setup lang="ts">
defineProps<{
  active?: boolean
  disabled?: boolean
}>()

defineEmits<{
  select: []
  hover: []
}>()
</script>

<template>
  <li
    role="option"
    class="mx-1 cursor-pointer rounded px-2 py-1.5 transition-colors"
    :class="
      disabled
        ? 'cursor-default text-text-4'
        : active
          ? 'bg-accent/10 text-accent-text'
          : 'text-text-2 hover:bg-bg-2 hover:text-text-1'
    "
    :aria-selected="!!active"
    @mousedown.prevent="!disabled && $emit('select')"
    @mouseenter="$emit('hover')"
  >
    <slot />
  </li>
</template>
