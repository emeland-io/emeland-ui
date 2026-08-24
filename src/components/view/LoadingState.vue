<script setup lang="ts">
import { IconLoader2 } from '@tabler/icons-vue'

defineProps<{
  label: string
}>()
</script>

<template>
  <div class="flex flex-1 items-center justify-center">
    <div class="flex items-center gap-2 text-text-3">
      <IconLoader2
        :size="16"
        :stroke-width="1.5"
        class="animate-spin"
      />
      <span class="text-body">{{ label }}</span>
    </div>
  </div>
</template>
