<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowUpRight, IconAlertTriangle } from '@tabler/icons-vue'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import type { Context } from '@/types/context'
import type { SystemInstance } from '@/types/system'

const props = defineProps<{
  context: Context
}>()

const emit = defineEmits<{
  'navigate-parent': [id: string]
  'open-type': [id: string]
}>()

const store = useContextStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()
const { goToFinding, goToResource } = useResourceNav()

const typeUnknown = computed(() => store.getTypeName(props.context) === 'Unknown')

const children = computed(() =>
  store.contexts.filter((c) => c.parentId === props.context.contextId),
)

// system instances living in this context -> the related systems
function systemNameOf(inst: SystemInstance): string | undefined {
  if (!inst.system) return undefined
  return systemStore.systemMap.get(inst.system)?.displayName
}

const systemInstances = computed(() =>
  systemStore.systemInstances
    .filter((i) => i.context === props.context.contextId)
    .sort(
      (a, b) =>
        (systemNameOf(a) ?? '').localeCompare(systemNameOf(b) ?? '') ||
        a.displayName.localeCompare(b.displayName),
    ),
)

const relatedFindings = computed(() =>
  findingsStore.findings.filter((f) =>
    f.resources.some((r) => r.resourceId === props.context.contextId),
  ),
)
</script>

<template>
  <div
    v-if="context"
    class="@container flex-1 overflow-y-auto"
  >
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-title font-medium text-text-1">
            {{ context.displayName }}
          </h2>
          <div class="mt-2">
            <button
              v-if="context.contextTypeId"
              class="group inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-label transition-opacity hover:opacity-80"
              :class="typeUnknown ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent-text'"
              title="Show context type"
              @click="emit('open-type', context.contextTypeId)"
            >
              {{ store.getTypeName(context) }}
            </button>
            <span
              v-else
              class="rounded bg-error/10 px-2 py-0.5 font-mono text-label text-error"
            >
              Unknown
            </span>
          </div>
        </div>
        <div class="shrink-0 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <span class="font-mono text-label text-text-4">
              {{ context.contextId }}
            </span>
            <CopyButton
              :value="context.contextId"
              :size="13"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-5 px-6 py-5">
      <!-- detail load failed -->
      <div
        v-if="store.hasDetailError(context.contextId)"
        class="flex items-start gap-2 rounded border border-error/20 bg-error/5 px-3 py-2"
      >
        <div class="min-w-0">
          <div class="text-body text-error">Could not load full details</div>
          <div class="mt-0.5 font-mono text-meta text-error/80">
            Showing basic info only — the detail request failed.
          </div>
        </div>
      </div>
      <div
        class="grid gap-x-8 gap-y-5 @3xl:grid-cols-3 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8 @3xl:[&>*:nth-child(3)]:border-l @3xl:[&>*:nth-child(3)]:border-border-1/50 @3xl:[&>*:nth-child(3)]:pl-8"
      >
        <div class="flex flex-col gap-6">
          <div>
            <SectionLabel>Description</SectionLabel>
            <p
              v-if="context.description"
              class="text-body leading-relaxed text-text-2"
            >
              {{ context.description }}
            </p>
            <p
              v-else
              class="text-data leading-snug text-text-4"
            >
              No description.
            </p>
          </div>
          <div>
            <SectionLabel :count="systemInstances.length">Systems</SectionLabel>
            <p
              v-if="systemInstances.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No systems in this context.
            </p>
            <template
              v-for="inst in systemInstances"
              :key="inst.systemInstanceId"
            >
              <button
                v-if="systemNameOf(inst)"
                class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
                title="Go to system"
                @click="goToResource('System', inst.system)"
              >
                <span class="group/row flex w-full items-center gap-3">
                  <span
                    class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
                  >
                    System
                  </span>
                  <span
                    class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                  >
                    {{ systemNameOf(inst) }}
                  </span>
                  <IconArrowUpRight
                    :size="16"
                    :stroke-width="2"
                    class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                  />
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="min-w-0 truncate font-mono text-meta text-text-4">
                    {{ inst.displayName }}
                  </span>
                  <span class="ml-auto shrink-0 font-mono text-meta text-text-4">
                    {{ inst.system }}
                  </span>
                  <CopyButton
                    :value="inst.system"
                    :size="12"
                    @click.stop
                  />
                </span>
              </button>
              <!-- instance without a resolvable system -->
              <div
                v-else
                class="flex w-full flex-col gap-1 border-b border-border-1 py-2 last:border-b-0"
              >
                <span class="flex w-full items-center gap-3">
                  <span
                    class="w-28 shrink-0 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-error"
                  >
                    System
                  </span>
                  <span class="min-w-0 truncate text-body text-error">
                    {{ inst.system ? 'Unresolved system' : 'No system' }}
                  </span>
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="min-w-0 truncate font-mono text-meta text-text-4">
                    {{ inst.displayName }}
                  </span>
                  <span
                    v-if="inst.system"
                    class="ml-auto shrink-0 font-mono text-meta text-text-4"
                  >
                    {{ inst.system }}
                  </span>
                </span>
              </div>
            </template>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <SectionLabel>Parent</SectionLabel>
            <p
              v-if="!context.parentId"
              class="text-data leading-snug text-text-4"
            >
              No parent context.
            </p>
            <button
              v-else-if="!store.isParentUnresolved(context)"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to parent context"
              @click="emit('navigate-parent', context.parentId)"
            >
              <span class="group/row flex w-full items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
                >
                  Context
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                >
                  {{ store.getParentName(context) }}
                </span>
                <IconArrowUpRight
                  :size="16"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">
                  {{ context.parentId }}
                </span>
                <CopyButton
                  :value="context.parentId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
            <!-- unresolved parent -->
            <div
              v-else
              class="flex flex-col gap-1 border-b border-border-1 py-2 last:border-b-0"
            >
              <span class="flex w-full items-center gap-3">
                <span
                  class="flex w-28 shrink-0 items-center justify-center gap-1 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-error"
                >
                  <IconAlertTriangle
                    :size="12"
                    :stroke-width="2"
                  />
                  Context
                </span>
                <span class="min-w-0 truncate text-body text-error">Unresolved parent</span>
              </span>
              <span class="text-meta text-error/80">
                References a parent context that does not exist.
              </span>
              <span class="font-mono text-meta text-text-4">
                {{ context.parentId }}
              </span>
            </div>
          </div>
          <div>
            <SectionLabel
              :count="relatedFindings.length"
              tone="warning"
            >
              Findings
            </SectionLabel>
            <p
              v-if="relatedFindings.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No findings.
            </p>
            <button
              v-for="f in relatedFindings"
              :key="f.findingId"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to finding"
              @click="goToFinding(f.findingId)"
            >
              <span class="group/row flex w-full items-center gap-2.5">
                <span
                  class="shrink-0 rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
                >
                  {{ findingsStore.getKindForFinding(f) }}
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                >
                  {{ f.displayName }}
                </span>
                <IconArrowUpRight
                  :size="15"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ f.findingId }}</span>
                <CopyButton
                  :value="f.findingId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <SectionLabel :count="children.length">Sub-contexts</SectionLabel>
            <p
              v-if="children.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No sub-contexts.
            </p>
            <button
              v-for="child in children"
              :key="child.contextId"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to sub-context"
              @click="emit('navigate-parent', child.contextId)"
            >
              <span class="group/row flex w-full items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
                >
                  Context
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                >
                  {{ child.displayName }}
                </span>
                <IconArrowUpRight
                  :size="16"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ child.contextId }}</span>
                <CopyButton
                  :value="child.contextId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
          </div>
          <div>
            <!-- Annotations -->
            <SectionLabel :count="Object.keys(context.annotations).length">
              Annotations
            </SectionLabel>
            <p
              v-if="Object.keys(context.annotations).length === 0"
              class="text-data leading-snug text-text-4"
            >
              No annotations.
            </p>
            <AnnotationsTable
              v-else
              :annotations="context.annotations"
              layout="stacked"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
