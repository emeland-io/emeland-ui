<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconArrowUpRight } from '@tabler/icons-vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import ComponentInstancesBoard from '@/components/components/ComponentInstancesBoard.vue'
import ComponentInstanceDrawer from '@/components/components/ComponentInstanceDrawer.vue'
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

function versionDates(c: Component | undefined): [string, string][] {
  if (!c?.version) return []
  const v = c.version
  const rows: [string, string][] = []
  if (v.availableFrom) rows.push(['Available from', v.availableFrom])
  if (v.deprecatedFrom) rows.push(['Deprecated from', v.deprecatedFrom])
  if (v.terminatedFrom) rows.push(['Terminated from', v.terminatedFrom])
  return rows
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
            v-for="[label, value] in versionDates(component)"
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
        v-if="store.hasDetailError(component.componentId)"
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
            <button
              v-else-if="!systemUnresolved"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to system"
              @click="goToResource('System', component.system)"
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
                  {{ systemName }}
                </span>
                <IconArrowUpRight
                  :size="16"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ component.system }}</span>
                <CopyButton
                  :value="component.system"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
            <div
              v-else
              class="flex flex-col gap-1 border-b border-border-1 py-2 last:border-b-0"
            >
              <div class="flex items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-error"
                >
                  System
                </span>
                <span class="min-w-0 truncate text-body text-error">Unresolved system</span>
              </div>
              <span class="font-mono text-meta text-text-4">{{ component.system }}</span>
            </div>
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
            @select="openInstance"
          />
        </div>
      </div>
    </div>

    <ComponentInstanceDrawer
      :open="drawerOpen"
      :selected-instance-id="selectedInstanceId"
      @close="drawerOpen = false"
    />
  </div>
  <div
    v-else
    class="flex flex-1 items-center justify-center"
  >
    <span class="font-mono text-label text-text-4">Select a component to inspect</span>
  </div>
</template>
