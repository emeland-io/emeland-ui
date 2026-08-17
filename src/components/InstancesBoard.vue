<script setup lang="ts" generic="T extends { displayName: string }">
import { computed, ref } from 'vue'
import { IconLayoutGrid, IconList, IconSearch, IconLayoutSidebarRight } from '@tabler/icons-vue'
import ViewModeSwitch from '@/components/ViewModeSwitch.vue'
import TypeChip from '@/components/TypeChip.vue'
import type { ResolvedContext } from '@/composables/useInstanceContext'

/**
 * The instance board in the detail panes: instances grouped into per-context
 * card columns, or a flat list, with a text filter. The `card-extra` and
 * `list-extra` slots append per-instance chips (e.g. the system instance)
 */
const props = withDefaults(
  defineProps<{
    instances: T[]
    idOf: (inst: T) => string
    ctxOf: (inst: T) => ResolvedContext
    searchFields?: (inst: T) => (string | undefined)[]
    activeInstanceId?: string
  }>(),
  { searchFields: () => [], activeInstanceId: '' },
)

const emit = defineEmits<{
  select: [id: string]
}>()

const search = ref('')
const view = ref<'cards' | 'list'>('cards')
const viewModes = [
  { value: 'cards', label: 'Cards', icon: IconLayoutGrid },
  { value: 'list', label: 'List', icon: IconList },
]

const showFilter = computed(() => props.instances.length >= 1)

const ctxByInstance = computed(() => {
  const m = new Map<string, ResolvedContext>()
  for (const inst of props.instances) m.set(props.idOf(inst), props.ctxOf(inst))
  return m
})

function ctx(inst: T): ResolvedContext {
  return ctxByInstance.value.get(props.idOf(inst)) ?? { unresolved: false }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.instances
  return props.instances.filter((i) =>
    [i.displayName, props.idOf(i), ctx(i).name, ...props.searchFields(i)].some((f) =>
      (f ?? '').toLowerCase().includes(q),
    ),
  )
})

const NO_CONTEXT = 'NO_CONTEXT'

const columns = computed(() => {
  const map = new Map<string, { label: string; unresolved: boolean; items: T[] }>()
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
        <div class="mb-1.5 flex items-baseline gap-2 border-b border-border-1 px-1 pb-1.5">
          <span
            class="min-w-0 flex-1 truncate font-mono text-micro font-semibold uppercase tracking-wide"
            :class="col.unresolved ? 'text-error' : 'text-text-4'"
          >
            {{ col.label }}
          </span>
          <span class="shrink-0 font-mono text-micro tabular-nums text-text-4">
            {{ col.items.length }}
          </span>
        </div>

        <button
          v-for="inst in col.items"
          :key="idOf(inst)"
          class="instance-cut group mt-1 flex w-full items-baseline gap-2 px-2 py-1.5 text-left transition-colors first:mt-0 focus-visible:bg-accent/10 focus-visible:outline-none"
          :class="idOf(inst) === activeInstanceId ? 'bg-bg-3' : 'bg-bg-2 hover:bg-bg-3'"
          @click="emit('select', idOf(inst))"
        >
          <IconLayoutSidebarRight
            v-if="idOf(inst) === activeInstanceId"
            :size="13"
            :stroke-width="1.75"
            class="shrink-0 text-text-3"
            aria-label="Shown in drawer"
          />
          <span
            class="min-w-0 flex-1 truncate text-data leading-snug text-text-2 transition-colors group-hover:text-text-1"
            :title="inst.displayName"
          >
            {{ inst.displayName }}
          </span>
          <slot
            name="card-extra"
            :inst="inst"
          />
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
        :key="idOf(inst)"
        class="instance-cut group mt-1 flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors first:mt-0 focus-visible:bg-accent/10 focus-visible:outline-none"
        :class="idOf(inst) === activeInstanceId ? 'bg-bg-3' : 'bg-bg-2 hover:bg-bg-3'"
        @click="emit('select', idOf(inst))"
      >
        <IconLayoutSidebarRight
          v-if="idOf(inst) === activeInstanceId"
          :size="13"
          :stroke-width="1.75"
          class="shrink-0 text-text-3"
          aria-label="Shown in drawer"
        />
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
          <TypeChip type="Context" />
          {{ ctx(inst).name }}
        </span>
        <slot
          name="list-extra"
          :inst="inst"
        />
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
