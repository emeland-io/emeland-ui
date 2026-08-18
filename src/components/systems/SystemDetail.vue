<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import FindingCard from '@/components/detail/FindingCard.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import SystemInstancesBoard from '@/components/systems/SystemInstancesBoard.vue'
import { versionDates } from '@/utils/version'
import type { System, SystemInstance } from '@/types/system'

const props = defineProps<{
  system: System | undefined
  instances: SystemInstance[]
  activeInstanceId?: string
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

const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => props.system?.systemId ?? '',
)
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
            v-for="[label, value] in versionDates(system.version)"
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
      <DetailErrorBanner v-if="store.hasDetailError(system.systemId)" />
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
              <ResourceLinkCard
                v-for="ctx in contexts"
                :id="ctx.id"
                :key="ctx.id"
                :badge="contextType(ctx.id)"
                :name="ctx.name"
                title="Go to context"
                @click="goToResource('Context', ctx.id)"
              />
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
              <ResourceLinkCard
                v-else-if="!store.isParentUnresolved(system)"
                :id="system.parent"
                badge="System"
                :name="store.getParentName(system) ?? system.parent"
                title="Go to parent system"
                @click="emit('navigate-parent', system.parent!)"
              />
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
              <FindingCard
                v-for="f in relatedFindings"
                :key="f.findingId"
                :finding="f"
                @open="goToFinding"
              />
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
            <ResourceLinkCard
              v-for="child in children"
              :id="child.systemId"
              :key="child.systemId"
              :badge="store.getKindForSystem(child)"
              :badge-muted="child.abstract"
              :name="child.displayName"
              title="Go to sub-system"
              @click="emit('navigate-parent', child.systemId)"
            />
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
            :active-instance-id="activeInstanceId"
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
