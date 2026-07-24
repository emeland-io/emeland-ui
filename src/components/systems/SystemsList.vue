<script setup lang="ts">
import { IconChevronRight, IconAlertTriangle } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import type { System } from '@/types/system'

interface TreeRow {
  system: System
  depth: number
  hasChildren: boolean
}

defineProps<{
  systems: System[]
  treeRows: TreeRow[]
  viewMode: 'list' | 'tree'
  selectedId: string
  collapsed: Set<string>
}>()

const emit = defineEmits<{
  select: [id: string]
  'toggle-collapse': [id: string]
}>()

const store = useSystemStore()
const findingsStore = useFindingsStore()

function instanceCount(id: string): number {
  return store.getInstancesForSystem(id).length
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}
</script>

<template>
  <!-- flat list -->
  <template v-if="viewMode === 'list'">
    <div
      v-for="sys in systems"
      :key="sys.systemId"
      class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
      :class="
        sys.systemId === selectedId
          ? 'border-l-accent bg-accent/5'
          : 'border-l-transparent hover:bg-bg-1'
      "
      @click="emit('select', sys.systemId)"
    >
      <div class="text-body font-medium text-text-1">{{ sys.displayName }}</div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          class="rounded px-1.5 py-0.5 font-mono text-meta"
          :class="sys.abstract ? 'bg-bg-2 text-text-3' : 'bg-accent/10 text-accent'"
        >
          {{ store.getKindForSystem(sys) }}
        </span>
        <span
          v-if="sys.version?.version"
          class="font-mono text-meta text-text-4"
        >
          v{{ sys.version.version }}
        </span>
        <span
          v-if="store.getParentName(sys)"
          class="font-mono text-meta text-text-4"
        >
          ↳ {{ store.getParentName(sys) }}
        </span>
        <span
          v-if="findingCount(sys.systemId) > 0"
          class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
          :title="`${findingCount(sys.systemId)} finding(s)`"
        >
          <IconAlertTriangle
            :size="10"
            :stroke-width="2"
          />
          {{ findingCount(sys.systemId) }}
        </span>
        <span
          v-if="store.instancesLoaded && instanceCount(sys.systemId) > 0"
          class="ml-auto shrink-0 rounded-full bg-bg-2 px-1.5 py-0.5 font-mono text-micro text-text-3"
          :title="`${instanceCount(sys.systemId)} system instance(s)`"
        >
          {{ instanceCount(sys.systemId) }} inst
        </span>
      </div>
    </div>
  </template>
  <!-- hierarchy tree -->
  <template v-else>
    <div
      v-for="row in treeRows"
      :key="row.system.systemId"
      class="flex cursor-pointer items-center gap-2 border-b border-border-1 border-l-2 py-2.5 pr-4 transition-colors"
      :class="
        row.system.systemId === selectedId
          ? 'border-l-accent bg-accent/5'
          : 'border-l-transparent hover:bg-bg-1'
      "
      :style="{ paddingLeft: `${16 + row.depth * 18}px` }"
      @click="emit('select', row.system.systemId)"
    >
      <!-- expand/collapse toggle or spacer -->
      <button
        v-if="row.hasChildren"
        class="flex h-4 w-4 shrink-0 items-center justify-center rounded text-text-4 hover:text-text-2"
        :aria-label="collapsed.has(row.system.systemId) ? 'Expand' : 'Collapse'"
        @click.stop="emit('toggle-collapse', row.system.systemId)"
      >
        <IconChevronRight
          :size="14"
          :stroke-width="2"
          class="transition-transform"
          :class="{ 'rotate-90': !collapsed.has(row.system.systemId) }"
        />
      </button>
      <span
        v-else
        class="h-4 w-4 shrink-0"
      />
      <span class="truncate text-body font-medium text-text-1">
        {{ row.system.displayName }}
      </span>
      <span
        class="shrink-0 rounded px-1.5 py-0.5 font-mono text-micro"
        :class="row.system.abstract ? 'bg-bg-2 text-text-3' : 'bg-accent/10 text-accent'"
      >
        {{ store.getKindForSystem(row.system) }}
      </span>
      <span
        v-if="findingCount(row.system.systemId) > 0"
        class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
        :title="`${findingCount(row.system.systemId)} finding(s)`"
      >
        <IconAlertTriangle
          :size="10"
          :stroke-width="2"
        />
        {{ findingCount(row.system.systemId) }}
      </span>
      <span
        v-if="store.instancesLoaded && instanceCount(row.system.systemId) > 0"
        class="ml-auto shrink-0 rounded-full bg-bg-2 px-1.5 py-0.5 font-mono text-micro text-text-3"
        :title="`${instanceCount(row.system.systemId)} system instance(s)`"
      >
        {{ instanceCount(row.system.systemId) }} inst
      </span>
    </div>
  </template>
</template>
