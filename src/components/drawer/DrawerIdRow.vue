<script setup lang="ts">
import CopyButton from '@/components/CopyButton.vue'

withDefaults(
  defineProps<{
    label: string
    value?: string
    emptyLabel?: string
    emptyTitle?: string
  }>(),
  { value: undefined, emptyLabel: undefined, emptyTitle: undefined },
)
</script>

<template>
  <div
    class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
    style="grid-template-columns: minmax(160px, 30%) minmax(0, 1fr)"
  >
    <span class="text-text-3">{{ label }}</span>
    <span class="flex min-w-0 items-center gap-1.5">
      <span
        v-if="value"
        class="break-all text-text-2"
      >
        {{ value }}
      </span>
      <span
        v-else
        class="text-text-4"
        :title="emptyTitle"
      >
        {{ emptyLabel }}
      </span>
      <CopyButton
        v-if="value"
        :value="value"
        :size="12"
      />
    </span>
  </div>
</template>
