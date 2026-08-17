<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import FindingCard from '@/components/detail/FindingCard.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import ComponentInstancesBoard from '@/components/components/ComponentInstancesBoard.vue'
import ComponentInstanceDrawer from '@/components/components/ComponentInstanceDrawer.vue'
import { versionDates } from '@/utils/version'
import type { Component } from '@/types/component'

const props = defineProps<{
  component: Component | undefined
}>()

const store = useComponentStore()
const systemStore = useSystemStore()
const apiStore = useApiStore()
const findingsStore = useFindingsStore()
const { goToResource, goToFinding } = useResourceNav()

const systemName = computed(() =>
  props.component ? systemStore.systemMap.get(props.component.system)?.displayName : undefined,
)
const systemUnresolved = computed(
  () => !!props.component?.system && !systemStore.systemMap.has(props.component.system),
)

const provides = computed(() =>
  (props.component?.provides ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)
const consumes = computed(() =>
  (props.component?.consumes ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)

function apiKnown(id: string): boolean {
  return apiStore.apiMap.has(id)
}

const relatedFindings = computed(() => {
  const id = props.component?.componentId
  if (!id) return []
  return findingsStore.findings.filter((f) => f.resources.some((r) => r.resourceId === id))
})

const instances = computed(() =>
  props.component ? store.getInstancesForComponent(props.component.componentId) : [],
)

const drawerOpen = ref(false)
const selectedInstanceId = ref('')

function openInstance(id: string) {
  selectedInstanceId.value = id
  drawerOpen.value = true
}
</script>

<template>
  <div
    v-if="component"
    class="@container flex-1 overflow-y-auto"
  >
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-title font-medium text-text-1">{{ component.displayName }}</h2>
          <div class="mt-2 flex items-center gap-2">
            <span class="rounded bg-accent/10 px-2 py-0.5 font-mono text-label text-accent-text">
              Component
            </span>
            <span
              v-if="component.version?.version"
              class="rounded bg-bg-2 px-2 py-0.5 font-mono text-label text-text-3"
            >
              v{{ component.version.version }}
            </span>
          </div>
        </div>
        <div class="shrink-0 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <span class="font-mono text-label text-text-4">{{ component.componentId }}</span>
            <CopyButton
              :value="component.componentId"
              :size="13"
            />
          </div>
          <div
            v-for="[label, value] in versionDates(component.version)"
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
      <DetailErrorBanner v-if="store.hasDetailError(component.componentId)" />
      <div
        class="grid gap-x-8 gap-y-5 @3xl:grid-cols-3 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8 @3xl:[&>*:nth-child(3)]:border-l @3xl:[&>*:nth-child(3)]:border-border-1/50 @3xl:[&>*:nth-child(3)]:pl-8"
      >
        <div class="flex flex-col gap-6">
          <div>
            <!-- description -->
            <p
              v-if="component.description"
              class="text-body leading-relaxed text-text-2"
            >
              {{ component.description }}
            </p>
          </div>
          <div>
            <SectionLabel>System</SectionLabel>
            <p
              v-if="!component.system"
              class="text-data leading-snug text-text-4"
            >
              No system.
            </p>
            <ResourceLinkCard
              v-else-if="!systemUnresolved"
              :id="component.system"
              badge="System"
              :name="systemName ?? component.system"
              title="Go to system"
              @click="goToResource('System', component.system)"
            />
            <ResourceLinkCard
              v-else
              :id="component.system"
              badge="System"
              badge-error
              name="Unresolved system"
              name-error
              :clickable="false"
              :copyable="false"
            />
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <div>
              <SectionLabel :count="provides.length">Provides APIs</SectionLabel>
              <p
                v-if="provides.length === 0"
                class="text-data leading-snug text-text-4"
              >
                Provides no interfaces.
              </p>
              <div
                v-else
                class="flex flex-wrap gap-1.5"
              >
                <component
                  :is="apiKnown(api.id) ? 'button' : 'span'"
                  v-for="api in provides"
                  :key="api.id"
                  class="rounded bg-accent/10 px-2 py-0.5 font-mono text-label text-accent-text transition-colors"
                  :class="apiKnown(api.id) ? 'hover:bg-accent/20' : ''"
                  :title="apiKnown(api.id) ? `Go to API — ${api.id}` : api.id"
                  @click="apiKnown(api.id) && goToResource('API', api.id)"
                >
                  {{ api.name }}
                </component>
              </div>
            </div>
          </div>
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
        <div class="flex flex-col gap-6 @3xl:row-span-2">
          <div>
            <!-- Consumes -->
            <div>
              <SectionLabel :count="consumes.length">Consumes APIs</SectionLabel>
              <p
                v-if="consumes.length === 0"
                class="text-data leading-snug text-text-4"
              >
                Consumes no interfaces.
              </p>
              <div
                v-else
                class="flex flex-wrap gap-1.5"
              >
                <component
                  :is="apiKnown(api.id) ? 'button' : 'span'"
                  v-for="api in consumes"
                  :key="api.id"
                  class="rounded bg-bg-2 px-2 py-0.5 font-mono text-label text-text-3 transition-colors"
                  :class="apiKnown(api.id) ? 'hover:bg-bg-3 hover:text-text-1' : ''"
                  :title="apiKnown(api.id) ? `Go to API — ${api.id}` : api.id"
                  @click="apiKnown(api.id) && goToResource('API', api.id)"
                >
                  {{ api.name }}
                </component>
              </div>
            </div>
          </div>
          <div class="@3xl:col-start-3">
            <!-- Annotations -->
            <SectionLabel :count="Object.keys(component.annotations).length">
              Annotations
            </SectionLabel>
            <p
              v-if="Object.keys(component.annotations).length === 0"
              class="text-data leading-snug text-text-4"
            >
              No annotations.
            </p>
            <AnnotationsTable
              v-else
              :annotations="component.annotations"
              layout="stacked"
            />
          </div>
        </div>
        <div class="@3xl:col-span-2">
          <!-- Instances -->
          <ComponentInstancesBoard
            v-if="instances.length > 0"
            :instances="instances"
            :active-instance-id="drawerOpen ? selectedInstanceId : ''"
            @select="openInstance"
          />
        </div>
      </div>
    </div>

    <ComponentInstanceDrawer
      :open="drawerOpen"
      :selected-instance-id="selectedInstanceId"
      :nav-ids="instances.map((i) => i.componentInstanceId)"
      @close="drawerOpen = false"
      @navigate="(id) => (selectedInstanceId = id)"
    />
  </div>
  <div
    v-else
    class="flex flex-1 items-center justify-center"
  >
    <span class="font-mono text-label text-text-4">Select a component to inspect</span>
  </div>
</template>
