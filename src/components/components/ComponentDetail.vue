<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowUpRight } from '@tabler/icons-vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
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

const relatedFindings = computed(() => {
  const id = props.component?.componentId
  if (!id) return []
  return findingsStore.findings.filter((f) => f.resources.some((r) => r.resourceId === id))
})

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
    class="flex-1 overflow-y-auto"
  >
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-base font-medium text-text-1">{{ component.displayName }}</h2>
        <div class="flex items-center gap-1.5">
          <span class="font-mono text-xs text-text-4">{{ component.componentId }}</span>
          <CopyButton
            :value="component.componentId"
            :size="13"
          />
        </div>
      </div>
      <div
        v-if="component.version?.version"
        class="mt-2 flex items-center gap-2"
      >
        <span class="rounded bg-bg-2 px-2 py-0.5 font-mono text-xs text-text-3">
          v{{ component.version.version }}
        </span>
      </div>
    </div>
    <div class="flex flex-col gap-5 px-6 py-5">
      <!-- detail load failed -->
      <div
        v-if="store.hasDetailError(component.componentId)"
        class="flex items-start gap-2 rounded border border-error/20 bg-error/5 px-3 py-2"
      >
        <div class="min-w-0">
          <div class="text-sm text-error">Could not load full details</div>
          <div class="mt-0.5 font-mono text-[11px] text-error/80">
            Showing basic info only — the detail request failed.
          </div>
        </div>
      </div>
      <!-- description -->
      <p
        v-if="component.description"
        class="font-mono text-sm leading-relaxed text-text-2"
      >
        {{ component.description }}
      </p>
      <!-- Owning system -->
      <div v-if="component.system">
        <SectionLabel>System</SectionLabel>
        <button
          v-if="!systemUnresolved"
          class="group/row flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          title="Go to system"
          @click="goToResource('System', component.system)"
        >
          <span
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-[11px] font-semibold uppercase text-accent"
          >
            System
          </span>
          <span
            class="max-w-full truncate text-sm text-text-2 transition-colors group-hover/row:text-accent"
          >
            {{ systemName }}
          </span>
          <IconArrowUpRight
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-[11px] text-text-4">{{ component.system }}</span>
            <CopyButton
              :value="component.system"
              :size="12"
              @click.stop
            />
          </div>
        </button>
        <div
          v-else
          class="flex items-center gap-3 border-b border-border-1 py-2 last:border-b-0"
        >
          <span
            class="w-28 shrink-0 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-[11px] font-semibold uppercase text-error"
          >
            System
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm text-error">Unresolved system</div>
          </div>
          <span class="font-mono text-[11px] text-text-4">{{ component.system }}</span>
        </div>
      </div>
      <!-- Provides -->
      <div v-if="provides.length > 0">
        <SectionLabel :count="provides.length">Provides APIs</SectionLabel>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="api in provides"
            :key="api.id"
            class="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent"
            :title="api.id"
          >
            {{ api.name }}
          </span>
        </div>
      </div>
      <!-- Consumes -->
      <div v-if="consumes.length > 0">
        <SectionLabel :count="consumes.length">Consumes APIs</SectionLabel>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="api in consumes"
            :key="api.id"
            class="rounded bg-bg-2 px-2 py-0.5 font-mono text-xs text-text-3"
            :title="api.id"
          >
            {{ api.name }}
          </span>
        </div>
      </div>
      <!-- Version dates -->
      <div v-if="versionDates(component).length > 0">
        <SectionLabel>Version</SectionLabel>
        <div
          v-for="[label, value] in versionDates(component)"
          :key="label"
          class="grid gap-4 border-b border-border-1 py-1.5 text-sm last:border-b-0"
          style="grid-template-columns: minmax(200px, 35%) minmax(0, 1fr)"
        >
          <span class="font-mono text-text-3">{{ label }}</span>
          <span class="break-all font-mono text-text-2">{{ value }}</span>
        </div>
      </div>
      <!-- Annotations -->
      <div v-if="Object.keys(component.annotations).length > 0">
        <SectionLabel>Annotations</SectionLabel>
        <AnnotationsTable :annotations="component.annotations" />
      </div>
      <!-- Related findings -->
      <div v-if="relatedFindings.length > 0">
        <SectionLabel>Findings</SectionLabel>
        <button
          v-for="f in relatedFindings"
          :key="f.findingId"
          class="group flex w-full items-center gap-2.5 border-b border-border-1 py-2 text-left last:border-b-0"
          title="Go to finding"
          @click="goToFinding(f.findingId)"
        >
          <span
            class="shrink-0 rounded bg-sensor/10 px-1.5 py-0.5 font-mono text-[10px] text-sensor"
          >
            {{ findingsStore.getKindForFinding(f) }}
          </span>
          <span
            class="max-w-full truncate text-sm text-text-2 transition-colors group-hover:text-accent"
          >
            {{ f.displayName }}
          </span>
          <IconArrowUpRight
            :size="15"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <span class="ml-auto shrink-0 font-mono text-[11px] text-text-4">{{ f.findingId }}</span>
        </button>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex flex-1 items-center justify-center"
  >
    <span class="font-mono text-xs text-text-4">Select a component to inspect</span>
  </div>
</template>
