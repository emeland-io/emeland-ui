<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { IconStack2, IconLayoutGrid, IconList, IconSearch } from '@tabler/icons-vue'
import { useComponentInstanceList } from '@/composables/useComponentInstanceList'
import ViewModeSwitch from '@/components/ViewModeSwitch.vue'
import type { ComponentInstance } from '@/types/component'

const props = defineProps<{
  instances: ComponentInstance[]
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { search, filtered, showFilter, systemInstanceName, contextForInstance } =
  useComponentInstanceList(toRef(props, 'instances'))

const view = ref<'cards' | 'list'>('cards')
const viewModes = [
  { value: 'cards', label: 'Cards', icon: IconLayoutGrid },
  { value: 'list', label: 'List', icon: IconList },
]

const NO_CONTEXT = 'NO_CONTEXT'

const ctxByInstance = computed(() => {
  const m = new Map<string, ReturnType<typeof contextForInstance>>()
  for (const inst of props.instances) m.set(inst.componentInstanceId, contextForInstance(inst))
  return m
})

function ctx(inst: ComponentInstance): ReturnType<typeof contextForInstance> {
  return ctxByInstance.value.get(inst.componentInstanceId) ?? { unresolved: false }
}

const columns = computed(() => {
  const map = new Map<string, { label: string; unresolved: boolean; items: ComponentInstance[] }>()
  for (const inst of filtered.value) {
    const c = ctx(inst)
    const key = c.id ?? NO_CONTEXT
    const label = c.unresolved ? 'Unresolved context' : (c.name ?? 'No context')
    const bucket = map.get(key)
    if (bucket) bucket.items.push(inst)
    else map.set(key, { label, unresolved: c.unresolved, items: [inst] })
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => a.label.localeCompare(b.label))
})
</script>

<template>
  <div class="rounded-lg border border-border-1 bg-bg-1 p-4">
    <!-- header -->
    <div class="mb-3 flex items-center gap-2">
      <IconStack2
        :size="15"
        :stroke-width="2"
        class="shrink-0 text-accent"
      />
      <span class="text-body font-medium text-text-1">Instances</span>
      <span class="text-meta text-text-4">
        {{ filtered.length }} across {{ columns.length }}
        {{ columns.length === 1 ? 'context' : 'contexts' }}
      </span>
      <div class="ml-auto flex items-center gap-2">
        <div
          v-if="showFilter"
          class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1 transition-shadow focus-within:ring-1 focus-within:ring-border-2"
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
            class="w-36 bg-transparent font-mono text-meta text-text-2 outline-none placeholder:text-text-4"
          />
        </div>
        <ViewModeSwitch
          v-model="view"
          :options="viewModes"
        />
      </div>
    </div>

    <!-- Cards -->
    <div
      v-if="view === 'cards'"
      class="grid gap-2"
      style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))"
    >
      <div
        v-for="col in columns"
        :key="col.key"
        class="rounded-lg border border-dashed border-border-2 p-2"
      >
        <div class="mb-1.5 flex items-center gap-2 px-1">
          <span
            class="min-w-0 flex-1 truncate font-mono text-micro font-semibold uppercase tracking-wide"
            :class="col.unresolved ? 'text-error' : 'text-text-4'"
          >
            {{ col.label }}
          </span>
          <span class="shrink-0 font-mono text-micro text-text-4">{{ col.items.length }}</span>
        </div>

        <button
          v-for="inst in col.items"
          :key="inst.componentInstanceId"
          class="instance-cut group mt-1 flex w-full flex-col gap-0.5 bg-bg-2 px-2 py-1.5 text-left transition-colors first:mt-0 hover:bg-bg-3 focus-visible:bg-accent/10 focus-visible:outline-none"
          @click="emit('select', inst.componentInstanceId)"
        >
          <span
            class="min-w-0 truncate text-data leading-snug text-text-2 transition-colors group-hover:text-text-1"
            :title="inst.displayName"
          >
            {{ inst.displayName }}
          </span>
          <span
            v-if="systemInstanceName(inst.systemInstance)"
            class="flex min-w-0 items-center gap-1 font-mono text-micro text-text-4"
          >
            <span class="shrink-0 rounded-sm bg-bg-3 px-1 text-text-3">I</span>
            <span class="truncate">{{ systemInstanceName(inst.systemInstance) }}</span>
          </span>
        </button>
      </div>
    </div>

    <!-- List -->
    <div
      v-else
      class="rounded-lg border border-dashed border-border-2 p-2"
    >
      <button
        v-for="inst in filtered"
        :key="inst.componentInstanceId"
        class="instance-cut group mt-1 flex w-full items-center gap-2 bg-bg-2 px-2.5 py-1.5 text-left transition-colors first:mt-0 hover:bg-bg-3 focus-visible:bg-accent/10 focus-visible:outline-none"
        @click="emit('select', inst.componentInstanceId)"
      >
        <span
          class="min-w-0 flex-1 truncate text-data leading-snug text-text-2 transition-colors group-hover:text-text-1"
          :title="inst.displayName"
        >
          {{ inst.displayName }}
        </span>
        <span
          v-if="ctx(inst).name"
          class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-4"
        >
          <span class="rounded-sm bg-bg-3 px-1 text-text-3">C</span>
          {{ ctx(inst).name }}
        </span>
        <span
          v-if="systemInstanceName(inst.systemInstance)"
          class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-4"
        >
          <span class="rounded-sm bg-bg-3 px-1 text-text-3">I</span>
          {{ systemInstanceName(inst.systemInstance) }}
        </span>
      </button>
    </div>

    <p
      v-if="filtered.length === 0"
      class="py-2 text-meta text-text-4"
    >
      No instances match the filter.
    </p>
  </div>
</template>

<style scoped>
.instance-cut {
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
}
</style>
