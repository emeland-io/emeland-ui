<script setup lang="ts">
import { computed } from 'vue'
import { IconSearch, IconList, IconHierarchy, IconArrowDown, IconArrowUp } from '@tabler/icons-vue'

const props = defineProps<{
  search: string
  kinds: readonly string[]
  activeKinds: Set<string>
  contexts: { id: string; name: string }[]
  activeContexts: Set<string>
  hasActiveFilters: boolean
  viewMode: 'list' | 'tree'
  canExpand: boolean
  allCollapsed: boolean
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-kind': [kind: string]
  'toggle-context': [id: string]
  clear: []
  'update:viewMode': [mode: 'list' | 'tree']
  'toggle-all': []
}>()

const searchModel = computed({
  get: () => props.search,
  set: (v: string) => emit('update:search', v),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
    <div
      class="flex items-center gap-2 rounded border border-border-1 bg-bg-1 px-2.5 py-1.5"
      style="min-width: 300px"
    >
      <IconSearch
        :size="13"
        :stroke-width="1.5"
        class="shrink-0 text-text-4"
      />
      <input
        v-model="searchModel"
        type="text"
        placeholder="Search systems, IDs, annotations..."
        class="w-full bg-transparent font-mono text-label text-text-2 outline-none placeholder:text-text-4"
      />
    </div>
    <div class="h-4 w-px shrink-0 bg-bg-3" />
    <span class="text-meta text-text-4">Kind</span>
    <button
      v-for="kind in kinds"
      :key="kind"
      class="rounded border px-2 py-1 font-mono text-meta transition-colors"
      :class="
        activeKinds.has(kind)
          ? 'border-accent/20 bg-accent/10 text-accent-text'
          : 'border-transparent text-text-4 hover:bg-bg-2 hover:text-text-3'
      "
      @click="emit('toggle-kind', kind)"
    >
      {{ kind }}
    </button>
    <template v-if="contexts.length > 0">
      <div class="h-4 w-px shrink-0 bg-bg-3" />
      <span class="text-meta text-text-4">Context</span>
      <button
        v-for="ctx in contexts"
        :key="ctx.id"
        class="rounded border px-2 py-1 font-mono text-meta transition-colors"
        :class="
          activeContexts.has(ctx.id)
            ? 'border-accent/20 bg-accent/10 text-accent-text'
            : 'border-transparent text-text-4 hover:bg-bg-2 hover:text-text-3'
        "
        @click="emit('toggle-context', ctx.id)"
      >
        {{ ctx.name }}
      </button>
    </template>
    <button
      v-if="hasActiveFilters"
      class="flex items-center gap-1 text-meta text-text-4 hover:text-text-2"
      @click="emit('clear')"
    >
      Clear
    </button>
    <div class="ml-auto flex items-center gap-2">
      <!-- expand / collapse all (tree mode only) -->
      <button
        v-if="viewMode === 'tree' && canExpand"
        class="flex items-center gap-1.5 rounded border border-border-1 px-2 py-1 text-meta text-text-3 transition-colors hover:bg-bg-2 hover:text-text-2"
        :title="allCollapsed ? 'Expand all' : 'Collapse all'"
        @click="emit('toggle-all')"
      >
        <component
          :is="allCollapsed ? IconArrowDown : IconArrowUp"
          :size="13"
          :stroke-width="1.75"
        />
        {{ allCollapsed ? 'Expand all' : 'Collapse all' }}
      </button>
      <!-- view mode toggle: tree first, then list -->
      <div class="flex items-center gap-0.5 rounded border border-border-1 bg-bg-1 p-0.5">
        <button
          class="flex h-6 w-6 items-center justify-center rounded transition-colors"
          :class="viewMode === 'tree' ? 'bg-bg-3 text-text-1' : 'text-text-4 hover:text-text-2'"
          title="Hierarchy view"
          aria-label="Hierarchy view"
          @click="emit('update:viewMode', 'tree')"
        >
          <IconHierarchy
            :size="13"
            :stroke-width="1.75"
          />
        </button>
        <button
          class="flex h-6 w-6 items-center justify-center rounded transition-colors"
          :class="viewMode === 'list' ? 'bg-bg-3 text-text-1' : 'text-text-4 hover:text-text-2'"
          title="List view"
          aria-label="List view"
          @click="emit('update:viewMode', 'list')"
        >
          <IconList
            :size="13"
            :stroke-width="1.75"
          />
        </button>
      </div>
    </div>
  </div>
</template>
