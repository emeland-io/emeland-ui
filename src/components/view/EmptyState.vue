<script setup lang="ts">
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-vue'

withDefaults(
  defineProps<{
    title: string
    hint: string
    /** 'off' = nothing here; 'ok' = nothing wrong (findings) */
    variant?: 'off' | 'ok'
  }>(),
  { variant: 'off' },
)
</script>

<template>
  <div class="flex flex-1 items-center justify-center">
    <div class="text-center">
      <component
        :is="variant === 'ok' ? IconCircleCheck : IconCircleOff"
        :size="32"
        :stroke-width="1.5"
        class="mx-auto"
        :class="variant === 'ok' ? 'text-accent' : 'text-text-4'"
      />
      <p class="mt-3 text-body text-text-2">{{ title }}</p>
      <p class="mt-1 text-label text-text-4">{{ hint }}</p>
    </div>
  </div>
</template>
