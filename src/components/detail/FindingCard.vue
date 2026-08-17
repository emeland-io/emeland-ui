<script setup lang="ts">
import { IconArrowUpRight } from '@tabler/icons-vue'
import CopyButton from '@/components/CopyButton.vue'
import { useFindingsStore } from '@/stores/findings'
import type { Finding } from '@/types/finding'

defineProps<{
  finding: Finding
}>()

const emit = defineEmits<{
  open: [id: string]
}>()

const findingsStore = useFindingsStore()
</script>

<template>
  <button
    class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
    title="Go to finding"
    @click="emit('open', finding.findingId)"
  >
    <span class="group/row flex w-full items-center gap-2.5">
      <span
        class="shrink-0 rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
      >
        {{ findingsStore.getKindForFinding(finding) }}
      </span>
      <span
        class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
      >
        {{ finding.displayName }}
      </span>
      <IconArrowUpRight
        :size="15"
        :stroke-width="2"
        class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
      />
    </span>
    <span class="flex items-center gap-1.5">
      <span class="font-mono text-meta text-text-4">{{ finding.findingId }}</span>
      <CopyButton
        :value="finding.findingId"
        :size="12"
        @click.stop
      />
    </span>
  </button>
</template>
