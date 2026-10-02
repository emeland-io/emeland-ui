<script setup lang="ts">
/**
 * Shared floating list panel for YAML-editor comboboxes / selects
 */
defineProps<{
  open: boolean
  openUp?: boolean
  size?: 'match' | 'content' | 'wide'
  emptyText?: string
  showEmpty?: boolean
}>()
</script>

<template>
  <ul
    v-if="open"
    class="absolute left-0 z-30 max-h-56 overflow-y-auto rounded-md border border-border-1 bg-bg-0 py-1 shadow-md"
    :class="[
      openUp ? 'bottom-full mb-1' : 'top-full mt-1',
      size === 'wide'
        ? 'w-max min-w-full max-w-sm'
        : size === 'content'
          ? 'w-max min-w-full max-w-xs'
          : 'w-full max-w-sm',
    ]"
    role="listbox"
  >
    <li
      v-if="showEmpty"
      class="px-2.5 py-2 text-meta text-text-4"
      role="presentation"
    >
      {{ emptyText || 'No matches' }}
    </li>
    <template v-else>
      <slot />
    </template>
  </ul>
</template>
