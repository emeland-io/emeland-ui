<script setup lang="ts">
import { IconArrowUpRight } from '@tabler/icons-vue'
import type { Finding, FindingType } from '@/types/finding'
import CopyButton from '../CopyButton.vue'

defineProps<{
  finding: Finding
  kind: string
  type: FindingType | undefined
}>()
</script>

<template>
  <div class="h-full overflow-y-auto">
    <!-- Header -->
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-base font-medium text-text-1">{{ finding.summary }}</h2>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="font-mono text-xs text-text-4">{{ finding.findingId }}</span>
          <CopyButton
            :value="finding.findingId"
            :size="13"
          />
        </div>
      </div>
      <div class="mt-2 flex items-center gap-2.5">
        <span class="rounded bg-sensor/10 px-2 py-0.5 font-mono text-xs text-sensor">
          {{ kind }}
        </span>
        <button class="text-xs text-text-4 transition-colors hover:text-text-2">View Policy</button>
      </div>
    </div>

    <div class="flex flex-col gap-5 px-6 py-5">
      <!-- Description -->
      <div
        v-if="finding.description"
        class="rounded border border-border-1 bg-bg-1 px-4 py-3 font-mono text-sm leading-relaxed text-text-2"
      >
        {{ finding.description }}
      </div>

      <!-- Resources -->
      <div v-if="finding.resources.length > 0">
        <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
          Resources
        </div>
        <div
          v-for="res in finding.resources"
          :key="res.resourceId"
          class="flex items-center gap-3 border-b border-border-1 py-2 last:border-b-0"
        >
          <span
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-[11px] font-semibold uppercase text-accent"
          >
            {{ res.resourceType }}
          </span>
          <span class="font-mono text-sm text-text-2">{{ res.resourceId }}</span>
          <button
            class="shrink-0 text-text-4 transition-colors hover:text-text-2"
            aria-label="Copy resource ID"
          >
            <IconArrowUpRight
              :size="16"
              :stroke-width="2"
            />
          </button>
        </div>
      </div>

      <!-- Annotations -->
      <div v-if="Object.keys(finding.annotations).length > 0">
        <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
          Annotations
        </div>
        <div
          v-for="(value, key) in finding.annotations"
          :key="key"
          class="grid gap-4 border-b border-border-1 py-1.5 last:border-b-0 text-sm"
          style="grid-template-columns: 300px minmax(0, 1fr)"
        >
          <span class="truncate font-mono text-text-3">{{ key }}</span>
          <span class="truncate font-mono text-text-2">{{ value }}</span>
        </div>
      </div>

      <!-- Finding type -->
      <div v-if="type">
        <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
          Finding type
        </div>
        <div class="rounded border border-border-1 bg-bg-1 px-4 py-3">
          <div class="font-mono text-sm font-medium text-text-1">{{ type.displayName }}</div>
          <div
            v-if="type.description"
            class="mt-1.5 font-mono text-xs leading-relaxed text-text-3"
          >
            {{ type.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
