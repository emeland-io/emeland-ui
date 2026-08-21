<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import { useContextLabels } from '@/composables/useContextLabels'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import SectionLabel from '@/components/SectionLabel.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailHeader from '@/components/detail/DetailHeader.vue'
import TypeTag from '@/components/TypeTag.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import SystemInstancesBoard from '@/components/systems/SystemInstancesBoard.vue'
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
const findingsStore = useFindingsStore()
const { contextName, contextType } = useContextLabels()
const { goToResource } = useResourceNav()

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
    <DetailHeader
      :id="system.systemId"
      :title="system.displayName"
      :version="system.version"
    >
      <TypeTag :tone="system.abstract ? 'muted' : 'accent'">
        {{ store.getKindForSystem(system) }}
      </TypeTag>
      <TypeTag
        v-if="system.version?.version"
        tone="muted"
      >
        v{{ system.version.version }}
      </TypeTag>
    </DetailHeader>
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
              <ResourceLinkCard
                v-else
                :id="system.parent!"
                badge="System"
                badge-error
                name="Unresolved parent"
                name-error
                :clickable="false"
                :copyable="false"
              >
                <template #subline>
                  <span class="min-w-0 truncate text-meta text-error/80">
                    References a parent system that does not exist.
                  </span>
                  <span class="ml-auto shrink-0 font-mono text-meta text-text-4">
                    {{ system.parent }}
                  </span>
                </template>
              </ResourceLinkCard>
            </div>
          </div>
          <!-- Related findings -->
          <DetailFindingsSection :findings="relatedFindings" />
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
          <!-- Annotations -->
          <DetailAnnotationsSection :annotations="system.annotations" />
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
  <DetailEmptyState
    v-else
    label="Select a system to inspect"
  />
</template>
