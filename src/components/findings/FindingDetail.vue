<script setup lang="ts">
import { IconArrowUpRight } from '@tabler/icons-vue'
import type { Finding } from '@/types/finding'
import type { ResourceType } from '@/types/common'
import CopyButton from '@/components/CopyButton.vue'
import { isResourceNavigable } from '@/constants/resources'

defineProps<{
  finding: Finding
  kind: string
}>()

const emit = defineEmits<{
  navigateResource: [resourceType: ResourceType, resourceId: string]
  openType: [findingTypeId: string]
}>()
</script>

<template>
  <div
    v-if="finding"
    class="h-full overflow-y-auto"
  >
    <!-- Header -->
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-title font-medium text-text-1">{{ finding.displayName }}</h2>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="font-mono text-label text-text-id">{{ finding.findingId }}</span>
          <CopyButton
            :value="finding.findingId"
            :size="13"
          />
        </div>
      </div>
      <div class="mt-2 flex items-center gap-2.5">
        <button
          v-if="finding.findingType"
          class="group flex items-center gap-1 rounded border border-warning/20 bg-warning/10 px-2 py-0.5 font-mono text-label text-warning transition-colors hover:bg-warning/20"
          title="Show finding type"
          @click="emit('openType', finding.findingType.findingTypeId)"
        >
          {{ kind }}
        </button>
        <span
          v-else
          class="rounded border border-warning/20 bg-warning/10 px-2 py-0.5 font-mono text-label text-warning"
        >
          {{ kind }}
        </span>
        <button class="text-label text-text-4 transition-colors hover:text-text-2">
          View Policy
        </button>
      </div>
    </div>
    <div class="flex flex-col gap-5 px-6 py-5">
      <!-- Description -->
      <div
        v-if="finding.description"
        class="text-body leading-relaxed text-text-2"
      >
        {{ finding.description }}
      </div>
      <!-- Resources -->
      <div v-if="finding.resources.length > 0">
        <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
          Resources
        </div>
        <div
          v-for="res in finding.resources"
          :key="res.resourceId"
          class="flex items-center gap-3 border-b border-border-1 py-2 last:border-b-0"
        >
          <span
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent"
          >
            {{ res.resourceType }}
          </span>
          <!-- Navigable: name (or id fallback) + jump, copy on id -->
          <button
            v-if="isResourceNavigable(res.resourceType)"
            class="group flex min-w-0 flex-1 items-center gap-1.5 text-left"
            :title="`Go to ${res.resourceType}`"
            @click="emit('navigateResource', res.resourceType, res.resourceId)"
          >
            <span class="truncate text-body text-text-2 transition-colors group-hover:text-accent">
              {{ res.displayName || res.resourceId }}
            </span>
            <IconArrowUpRight
              :size="16"
              :stroke-width="2"
              class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
            />
          </button>
          <!-- Non-navigable: name (or id fallback) -->
          <span
            v-else
            class="min-w-0 flex-1 truncate text-body text-text-2"
          >
            {{ res.displayName || res.resourceId }}
          </span>
          <!-- id + copy -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="font-mono text-meta text-text-id">{{ res.resourceId }}</span>
            <CopyButton
              :value="res.resourceId"
              :size="12"
            />
          </div>
        </div>
      </div>
      <!-- Annotations -->
      <div v-if="Object.keys(finding.annotations).length > 0">
        <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
          Annotations
        </div>
        <div
          v-for="(value, key) in finding.annotations"
          :key="key"
          class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
          style="grid-template-columns: minmax(200px, 35%) minmax(0, 1fr)"
        >
          <span
            class="truncate text-text-3"
            :title="key"
          >
            {{ key }}
          </span>
          <span class="break-all text-text-2">{{ value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>