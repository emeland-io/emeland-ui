<script setup lang="ts">
import CopyButton from '@/components/CopyButton.vue'
import { versionDates } from '@/utils/version'
import type { Version } from '@/types/common'

defineProps<{
  title: string
  id: string
  subtitle?: string
  version?: Version
}>()
</script>

<template>
  <div class="border-b border-border-1 px-6 py-4">
    <div class="flex items-start justify-between gap-3">
      <h2 class="min-w-0 text-title font-medium text-text-1">{{ title }}</h2>
      <div
        v-if="$slots.actions"
        class="flex shrink-0 items-center gap-1"
      >
        <slot name="actions" />
      </div>
    </div>
    <p
      v-if="subtitle"
      class="mt-2 text-body leading-relaxed text-text-2"
    >
      {{ subtitle }}
    </p>

    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <slot />
      </div>
      <div class="ml-auto flex min-w-0 max-w-full items-center gap-1.5">
        <span
          class="min-w-0 truncate font-mono text-label text-text-4"
          :title="id"
        >
          {{ id }}
        </span>
        <CopyButton
          :value="id"
          :size="13"
        />
      </div>
    </div>

    <div
      v-if="versionDates(version).length > 0"
      class="mt-2 flex flex-wrap justify-end gap-x-4 gap-y-0.5 font-mono text-micro text-text-4"
    >
      <div
        v-for="[label, value] in versionDates(version)"
        :key="label"
        class="flex items-baseline gap-2"
      >
        <span>{{ label }}</span>
        <span class="tabular-nums text-text-3">{{ value }}</span>
      </div>
    </div>
  </div>
</template>
