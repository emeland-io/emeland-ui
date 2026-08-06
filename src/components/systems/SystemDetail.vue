<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowUpRight } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import SystemInstancesBoard from '@/components/systems/SystemInstancesBoard.vue'
import type { System, SystemInstance } from '@/types/system'

const props = defineProps<{
  system: System | undefined
  instances: SystemInstance[]
}>()

const emit = defineEmits<{
  'navigate-parent': [id: string]
  'open-instance': [id: string]
}>()

const store = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()
const { goToResource, goToFinding } = useResourceNav()

function contextName(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  return contextStore.contextMap.get(contextId)?.displayName
}

function contextType(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  const ctx = contextStore.contextMap.get(contextId)
  if (!ctx) return undefined
  const type = contextStore.getTypeName(ctx)
  return type === 'Unknown' ? undefined : type
}

const contexts = computed(() => {
  const seen = new Map<string, string>()
  for (const inst of props.instances) {
    if (inst.context && !seen.has(inst.context)) {
      seen.set(inst.context, contextName(inst.context) ?? inst.context)
    }
  }
  return [...seen].map(([id, name]) => ({ id, name }))
})

const children = computed(() => {
  const id = props.system?.systemId
  if (!id) return []
  return store.systems.filter((s) => s.parent === id)
})

const relatedFindings = computed(() => {
  const id = props.system?.systemId
  if (!id) return []
  return findingsStore.findings.filter((f) => f.resources.some((r) => r.resourceId === id))
})

function versionDates(s: System | undefined): [string, string][] {
  if (!s?.version) return []
  const v = s.version
  const rows: [string, string][] = []
  if (v.availableFrom) rows.push(['Available from', v.availableFrom])
  if (v.deprecatedFrom) rows.push(['Deprecated from', v.deprecatedFrom])
  if (v.terminatedFrom) rows.push(['Terminated from', v.terminatedFrom])
  return rows
}
</script>

<template>
  <div
    v-if="system"
    class="@container flex-1 overflow-y-auto"
  >
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-title font-medium text-text-1">{{ system.displayName }}</h2>
          <div class="mt-2 flex items-center gap-2">
            <span
              class="rounded px-2 py-0.5 font-mono text-label"
              :class="system.abstract ? 'bg-bg-2 text-text-3' : 'bg-accent/10 text-accent-text'"
            >
              {{ store.getKindForSystem(system) }}
            </span>
            <span
              v-if="system.version?.version"
              class="rounded bg-bg-2 px-2 py-0.5 font-mono text-label text-text-3"
            >
              v{{ system.version.version }}
            </span>
          </div>
        </div>
        <div class="shrink-0 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <span class="font-mono text-label text-text-4">{{ system.systemId }}</span>
            <CopyButton
              :value="system.systemId"
              :size="13"
            />
          </div>
          <div
            v-for="[label, value] in versionDates(system)"
            :key="label"
            class="mt-1 flex items-baseline justify-end gap-3 font-mono text-micro text-text-4"
          >
            <span>{{ label }}</span>
            <span class="tabular-nums text-text-3">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-5 px-6 py-5">
      <!-- detail load failed -->
      <div
        v-if="store.hasDetailError(system.systemId)"
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
            <!-- description -->
            <p
              v-if="system.description"
              class="text-body leading-relaxed text-text-2"
            >
              {{ system.description }}
            </p>
          </div>
          <div>
            <!-- Contexts -->
            <div>
              <SectionLabel :count="contexts.length">Contexts</SectionLabel>
              <p
                v-if="contexts.length === 0"
                class="text-data leading-snug text-text-4"
              >
                No contexts.
              </p>
              <button
                v-for="ctx in contexts"
                :key="ctx.id"
                class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
                title="Go to context"
                @click="goToResource('Context', ctx.id)"
              >
                <span class="group/row flex w-full items-center gap-3">
                  <span
                    v-if="contextType(ctx.id)"
                    class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
                  >
                    {{ contextType(ctx.id) }}
                  </span>
                  <span
                    class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                  >
                    {{ ctx.name }}
                  </span>
                  <IconArrowUpRight
                    :size="16"
                    :stroke-width="2"
                    class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                  />
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="font-mono text-meta text-text-4">{{ ctx.id }}</span>
                  <CopyButton
                    :value="ctx.id"
                    :size="12"
                    @click.stop
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <!-- Parent -->
            <div>
              <SectionLabel>Parent</SectionLabel>
              <p
                v-if="!system.parent"
                class="text-data leading-snug text-text-4"
              >
                No parent system.
              </p>
              <button
                v-else-if="!store.isParentUnresolved(system)"
                class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
                title="Go to parent system"
                @click="emit('navigate-parent', system.parent)"
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
                    {{ store.getParentName(system) }}
                  </span>
                  <IconArrowUpRight
                    :size="16"
                    :stroke-width="2"
                    class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                  />
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="font-mono text-meta text-text-4">{{ system.parent }}</span>
                  <CopyButton
                    :value="system.parent"
                    :size="12"
                    @click.stop
                  />
                </span>
              </button>
              <div
                v-else
                class="flex items-center gap-3 border-b border-border-1 py-2 last:border-b-0"
              >
                <span
                  class="w-28 shrink-0 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-error"
                >
                  System
                </span>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-body text-error">Unresolved parent</div>
                  <div class="mt-0.5 truncate font-mono text-meta text-error/80">
                    References a parent system that does not exist.
                  </div>
                </div>
                <span class="font-mono text-meta text-text-4">{{ system.parent }}</span>
              </div>
            </div>
          </div>
          <div>
            <!-- Related findings -->
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
        </div>
        <div class="flex flex-col gap-6 @3xl:row-span-2">
          <div>
            <!-- Sub-systems -->
            <SectionLabel :count="children.length">Sub-systems</SectionLabel>
            <p
              v-if="children.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No sub-systems.
            </p>
            <button
              v-for="child in children"
              :key="child.systemId"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to sub-system"
              @click="emit('navigate-parent', child.systemId)"
            >
              <span class="group/row flex w-full items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase"
                  :class="child.abstract ? 'bg-bg-2 text-text-3' : 'bg-accent/10 text-accent-text'"
                >
                  {{ store.getKindForSystem(child) }}
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
                <span class="font-mono text-meta text-text-4">{{ child.systemId }}</span>
                <CopyButton
                  :value="child.systemId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
          </div>
          <div>
            <!-- Annotations -->
            <SectionLabel :count="Object.keys(system.annotations).length">Annotations</SectionLabel>
            <p
              v-if="Object.keys(system.annotations).length === 0"
              class="text-data leading-snug text-text-4"
            >
              No annotations.
            </p>
            <AnnotationsTable
              v-else
              :annotations="system.annotations"
              layout="stacked"
            />
          </div>
        </div>
        <div class="@3xl:col-span-2">
          <!-- Instances -->
          <SystemInstancesBoard
            v-if="instances.length > 0"
            :instances="instances"
            @select="emit('open-instance', $event)"
          />
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex flex-1 items-center justify-center"
  >
    <span class="font-mono text-label text-text-4">Select a system to inspect</span>
  </div>
</template>
