<script setup lang="ts">
import { computed } from 'vue'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailHeader from '@/components/detail/DetailHeader.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
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
const { goToResource } = useResourceNav()

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

const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => props.context.contextId,
)
</script>

<template>
  <div
    v-if="context"
    class="@container flex-1 overflow-y-auto"
  >
    <DetailHeader
      :id="context.contextId"
      :title="context.displayName"
    >
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
    </DetailHeader>
    <div class="flex flex-col gap-5 px-6 py-5">
      <DetailErrorBanner v-if="store.hasDetailError(context.contextId)" />
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
              <ResourceLinkCard
                v-if="systemNameOf(inst)"
                :id="inst.system"
                badge="System"
                :name="systemNameOf(inst)!"
                title="Go to system"
                @click="goToResource('System', inst.system)"
              >
                <template #subline>
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
                </template>
              </ResourceLinkCard>
              <!-- instance without a resolvable system -->
              <ResourceLinkCard
                v-else
                :id="inst.system"
                badge="System"
                badge-error
                :name="inst.system ? 'Unresolved system' : 'No system'"
                name-error
                :clickable="false"
              >
                <template #subline>
                  <span class="min-w-0 truncate font-mono text-meta text-text-4">
                    {{ inst.displayName }}
                  </span>
                  <span
                    v-if="inst.system"
                    class="ml-auto shrink-0 font-mono text-meta text-text-4"
                  >
                    {{ inst.system }}
                  </span>
                </template>
              </ResourceLinkCard>
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
            <ResourceLinkCard
              v-else-if="!store.isParentUnresolved(context)"
              :id="context.parentId"
              badge="Context"
              :name="store.getParentName(context) ?? context.parentId"
              title="Go to parent context"
              @click="emit('navigate-parent', context.parentId!)"
            />
            <!-- unresolved parent -->
            <ResourceLinkCard
              v-else
              :id="context.parentId!"
              badge="Context"
              badge-error
              name="Unresolved parent"
              name-error
              :clickable="false"
              :copyable="false"
            >
              <template #subline>
                <span class="min-w-0 truncate text-meta text-error/80">
                  References a parent context that does not exist.
                </span>
                <span class="ml-auto shrink-0 font-mono text-meta text-text-4">
                  {{ context.parentId }}
                </span>
              </template>
            </ResourceLinkCard>
          </div>
          <DetailFindingsSection :findings="relatedFindings" />
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
            <ResourceLinkCard
              v-for="child in children"
              :id="child.contextId"
              :key="child.contextId"
              badge="Context"
              :name="child.displayName"
              title="Go to sub-context"
              @click="emit('navigate-parent', child.contextId)"
            />
          </div>
          <!-- Annotations -->
          <DetailAnnotationsSection :annotations="context.annotations" />
        </div>
      </div>
    </div>
  </div>
</template>
