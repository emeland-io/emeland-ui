<script setup lang="ts">
import type { Finding } from '@/types/finding'

defineProps<{
  findings: Finding[]
  selectedId: string
  kindFor: (f: Finding) => string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div
      v-for="finding in findings"
      :key="finding.findingId"
      class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
      :class="
        finding.findingId === selectedId
          ? 'border-l-accent bg-accent/5'
          : 'border-l-transparent hover:bg-bg-1'
      "
      @click="emit('select', finding.findingId)"
    >
      <div class="text-sm font-medium text-text-1">{{ finding.displayName }}</div>
      <div class="mt-1 truncate font-mono text-[12px] text-text-3">{{ finding.description }}</div>
      <div class="mt-2 flex items-center gap-1.5">
        <span class="rounded bg-sensor/10 px-1.5 py-0.5 font-mono text-[11px] text-sensor">
          {{ kindFor(finding) }}
        </span>
      </div>
    </div>
  </div>
</template>
