<script setup lang="ts">
import { IconAlertTriangle } from '@tabler/icons-vue'
import { pluralize } from '@/utils/text'

defineProps<{
  count: number
}>()
</script>

<template>
  <span
    v-if="count > 0"
    class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
    :title="pluralize(count, 'finding')"
  >
    <IconAlertTriangle
      :size="10"
      :stroke-width="2"
    />
    {{ count }}
  </span>
</template>
