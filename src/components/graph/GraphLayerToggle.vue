<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    on: boolean
    disabled?: boolean
    title?: string
  }>(),
  { disabled: false, title: undefined },
)

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-3"
    :disabled="disabled"
    :title="title"
    @click.stop="emit('toggle')"
    @dblclick.stop
  >
    {{ label }}
    <span
      class="rounded px-1 py-0.5 font-mono text-micro transition-colors"
      :class="on ? 'bg-accent/15 text-accent-text' : 'bg-bg-0 text-text-4'"
    >
      {{ on ? 'on' : 'off' }}
    </span>
  </button>
</template>
