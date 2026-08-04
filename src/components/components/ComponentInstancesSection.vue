<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconChevronRight, IconSearch, IconArrowUp } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useInstanceContext } from '@/composables/useInstanceContext'
import CopyButton from '@/components/CopyButton.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import type { ComponentInstance } from '@/types/component'

const props = defineProps<{
  instances: ComponentInstance[]
}>()

const systemStore = useSystemStore()
const { contextForInstance } = useInstanceContext()

const FILTER_THRESHOLD = 5

const search = ref('')
const expanded = ref<Set<string>>(new Set())

function systemInstanceName(id: string): string | undefined {
  return systemStore.systemInstances.find((si) => si.systemInstanceId === id)?.displayName
}

function ctxName(inst: ComponentInstance): string | undefined {
  return contextForInstance(inst).name
}

function detailRows(inst: ComponentInstance): { label: string; value: string; copy?: boolean }[] {
  const c = contextForInstance(inst)
  const rows: { label: string; value: string; copy?: boolean }[] = [
    { label: 'Instance ID', value: inst.componentInstanceId, copy: true },
  ]
  if (inst.systemInstance) {
    const name = systemInstanceName(inst.systemInstance)
    if (name) rows.push({ label: 'System instance', value: name })
    rows.push({ label: 'System instance ID', value: inst.systemInstance, copy: true })
  }
  if (c.name) rows.push({ label: 'Context', value: c.name })
  if (c.id) rows.push({ label: 'Context ID', value: c.id, copy: true })
  return rows
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.instances
  return props.instances.filter((i) => {
    return (
      i.displayName.toLowerCase().includes(q) ||
      i.componentInstanceId.toLowerCase().includes(q) ||
      (systemInstanceName(i.systemInstance) ?? '').toLowerCase().includes(q) ||
      (ctxName(i) ?? '').toLowerCase().includes(q)
    )
  })
})

const showFilter = computed(() => props.instances.length >= FILTER_THRESHOLD)
const anyExpanded = computed(() => expanded.value.size > 0)

function toggle(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expanded.value = next
}

function collapseAll() {
  expanded.value = new Set()
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2">
      <SectionLabel :count="instances.length">Instances</SectionLabel>
      <div class="mb-1.5 ml-auto flex items-center gap-2">
        <button
          v-if="anyExpanded"
          class="flex items-center gap-1 text-meta text-text-4 transition-colors hover:text-text-2"
          title="Collapse all"
          @click="collapseAll"
        >
          <IconArrowUp
            :size="12"
            :stroke-width="1.75"
          />
          Collapse all
        </button>
        <div
          v-if="showFilter"
          class="flex items-center gap-1.5 rounded border border-border-1 bg-bg-1 px-2 py-1"
        >
          <IconSearch
            :size="12"
            :stroke-width="1.5"
            class="shrink-0 text-text-4"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Filter instances..."
            class="w-40 bg-transparent font-mono text-meta text-text-2 outline-none placeholder:text-text-4"
          />
        </div>
      </div>
    </div>

    <!-- rows -->
    <div
      v-for="inst in filtered"
      :key="inst.componentInstanceId"
      class="border-b border-border-1 last:border-b-0"
    >
      <!-- collapsed row -->
      <button
        class="group/row -mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded px-2 py-2.5 text-left transition-colors hover:bg-bg-1"
        :aria-expanded="expanded.has(inst.componentInstanceId)"
        @click="toggle(inst.componentInstanceId)"
      >
        <IconChevronRight
          :size="14"
          :stroke-width="2"
          class="shrink-0 text-text-4 transition-transform"
          :class="{ 'rotate-90': expanded.has(inst.componentInstanceId) }"
        />
        <span class="truncate text-body text-text-2 transition-colors group-hover/row:text-accent">
          {{ inst.displayName }}
        </span>
        <span
          v-if="systemInstanceName(inst.systemInstance)"
          class="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-mono text-meta text-accent-text"
        >
          {{ systemInstanceName(inst.systemInstance) }}
        </span>
        <span
          v-if="ctxName(inst)"
          class="ml-auto shrink-0 truncate font-mono text-meta text-text-4"
        >
          {{ ctxName(inst) }}
        </span>
      </button>

      <!-- expanded -->
      <div
        v-if="expanded.has(inst.componentInstanceId)"
        class="mb-2.5 ml-6"
      >
        <div
          v-for="row in detailRows(inst)"
          :key="row.label"
          class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
          style="grid-template-columns: minmax(180px, 30%) minmax(0, 1fr)"
        >
          <span class="font-mono text-text-3">{{ row.label }}</span>
          <span class="flex min-w-0 items-center gap-1.5">
            <span class="break-all font-mono text-text-2">{{ row.value }}</span>
            <CopyButton
              v-if="row.copy"
              :value="row.value"
              :size="12"
            />
          </span>
        </div>
        <WellKnownAnnotationsTable
          :annotations="inst.annotations"
          columns="minmax(180px, 30%) minmax(0, 1fr)"
        />
        <div
          v-for="(value, key) in inst.annotations"
          :key="key"
          class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
          style="grid-template-columns: minmax(180px, 30%) minmax(0, 1fr)"
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

    <p
      v-if="filtered.length === 0"
      class="py-2 font-mono text-meta text-text-4"
    >
      No instances match the filter.
    </p>
  </div>
</template>
