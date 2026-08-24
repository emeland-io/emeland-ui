<script setup lang="ts">
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'

defineProps<{
  search: string
  systems: { id: string; name: string }[]
  activeSystems: Set<string>
  types: string[]
  activeTypes: Set<string>
  crossContext: boolean
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-system': [id: string]
  'toggle-type': [type: string]
  'toggle-cross-context': []
  clear: []
}>()
</script>

<template>
  <FilterToolbar
    :search="search"
    placeholder="Search APIs, IDs, annotations... (/)"
    :has-active-filters="hasActiveFilters"
    @update:search="(v) => emit('update:search', v)"
    @clear="emit('clear')"
  >
    <FilterChipGroup
      label="System"
      :items="systems"
      :active="activeSystems"
      @toggle="(id) => emit('toggle-system', id)"
    />
    <FilterChipGroup
      label="Type"
      :items="types"
      :active="activeTypes"
      @toggle="(t) => emit('toggle-type', t)"
    />
    <div class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1">
      <span
        class="shrink-0 cursor-default select-none text-micro font-medium uppercase tracking-wider text-text-4"
      >
        Boundary
      </span>
      <button
        class="rounded px-2 py-0.5 font-mono text-meta transition-colors"
        :class="
          crossContext
            ? 'bg-accent/10 text-accent-text'
            : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
        "
        title="Show only APIs consumed in a context they are not provided in"
        @click="emit('toggle-cross-context')"
      >
        Cross-context
      </button>
    </div>
  </FilterToolbar>
</template>
