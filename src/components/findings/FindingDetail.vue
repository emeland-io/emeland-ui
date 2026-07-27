<script setup lang="ts">
import { IconArrowUpRight } from '@tabler/icons-vue'
import type { Finding } from '@/types/finding'
import type { ResourceType } from '@/types/common'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
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
    class="@container flex-1 overflow-y-auto"
  >
    <!-- Header -->
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-title font-medium text-text-1">{{ finding.displayName }}</h2>
          <div class="mt-2 flex items-center gap-2.5">
            <button
              v-if="finding.findingType"
              class="rounded border border-warning/20 bg-warning/10 px-2 py-0.5 font-mono text-label text-warning transition-colors hover:bg-warning/20"
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
          </div>
        </div>
        <div class="shrink-0 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <span class="font-mono text-label text-text-4">{{ finding.findingId }}</span>
            <CopyButton
              :value="finding.findingId"
              :size="13"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5 px-6 py-5">
      <div class="grid gap-x-8 gap-y-5 @3xl:grid-cols-3">
        <div class="flex flex-col gap-5">
          <div>
            <SectionLabel>Description</SectionLabel>
            <p
              v-if="finding.description"
              class="text-body leading-relaxed text-text-2"
            >
              {{ finding.description }}
            </p>
            <p
              v-else
              class="text-data leading-snug text-text-4"
            >
              No description.
            </p>
          </div>
        </div>
        <div class="flex flex-col gap-5">
          <div>
            <SectionLabel :count="finding.resources.length">Resources</SectionLabel>
            <p
              v-if="finding.resources.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No resources referenced.
            </p>
            <component
              :is="isResourceNavigable(res.resourceType) ? 'button' : 'div'"
              v-for="res in finding.resources"
              :key="res.resourceId"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              :title="
                isResourceNavigable(res.resourceType) ? `Go to ${res.resourceType}` : undefined
              "
              @click="
                isResourceNavigable(res.resourceType) &&
                emit('navigateResource', res.resourceType, res.resourceId)
              "
            >
              <span class="group/row flex w-full items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent"
                >
                  {{ res.resourceType }}
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors"
                  :class="
                    isResourceNavigable(res.resourceType) ? 'group-hover/row:text-accent' : ''
                  "
                >
                  {{ res.displayName || res.resourceId }}
                </span>
                <IconArrowUpRight
                  v-if="isResourceNavigable(res.resourceType)"
                  :size="16"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ res.resourceId }}</span>
                <CopyButton
                  :value="res.resourceId"
                  :size="12"
                  @click.stop
                />
              </span>
            </component>
          </div>
        </div>
        <div class="flex flex-col gap-5">
          <!-- Annotations -->
          <div v-if="Object.keys(finding.annotations).length > 0">
            <SectionLabel>Annotations</SectionLabel>
            <AnnotationsTable
              :annotations="finding.annotations"
              layout="stacked"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
