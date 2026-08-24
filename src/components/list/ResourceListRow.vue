<script setup lang="ts">
defineProps<{
  id: string
  title: string
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div
    :data-row-id="id"
    class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
    :class="selected ? 'border-l-accent bg-accent/5' : 'border-l-transparent hover:bg-bg-1'"
    @click="emit('select', id)"
  >
    <div
      class="truncate text-body font-medium text-text-1"
      :title="title"
    >
      {{ title }}
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <slot />
      <span class="ml-auto flex shrink-0 items-center gap-1.5">
        <slot name="badges" />
      </span>
    </div>
  </div>
</template>
