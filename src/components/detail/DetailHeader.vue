<script setup lang="ts">
import CopyButton from '@/components/CopyButton.vue'
import { versionDates } from '@/utils/version'
import type { Version } from '@/types/common'

defineProps<{
  title: string
  id: string
  version?: Version
}>()
</script>

<template>
  <div class="border-b border-border-1 px-6 py-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-title font-medium text-text-1">{{ title }}</h2>
        <div class="mt-2 flex items-center gap-2">
          <slot />
        </div>
      </div>
      <div class="shrink-0 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <span class="font-mono text-label text-text-4">{{ id }}</span>
          <CopyButton
            :value="id"
            :size="13"
          />
        </div>
        <div
          v-for="[label, value] in versionDates(version)"
          :key="label"
          class="mt-1 flex items-baseline justify-end gap-3 font-mono text-micro text-text-4"
        >
          <span>{{ label }}</span>
          <span class="tabular-nums text-text-3">{{ value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
