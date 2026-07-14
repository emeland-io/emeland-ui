<script setup lang="ts">
import type { Component } from 'vue'

export interface ViewModeOption {
  value: string
  label: string
  icon: Component
}

defineProps<{
  modelValue: string
  options: ViewModeOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex items-center gap-0.5 rounded border border-border-1 bg-bg-1 p-0.5">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors"
      :class="
        modelValue === opt.value
          ? 'bg-accent/10 text-accent-text'
          : 'text-text-4 hover:bg-bg-2 hover:text-text-2'
      "
      :aria-pressed="modelValue === opt.value"
      :title="`${opt.label} view`"
      @click="emit('update:modelValue', opt.value)"
    >
      <component
        :is="opt.icon"
        :size="13"
        :stroke-width="1.75"
      />
      {{ opt.label }}
    </button>
  </div>
</template>
