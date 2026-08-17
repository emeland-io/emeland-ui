<script setup lang="ts">
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'

defineProps<{
  search: string
  kinds: readonly string[]
  activeKinds: Set<string>
  contexts: { id: string; name: string }[]
  activeContexts: Set<string>
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-kind': [kind: string]
  'toggle-context': [id: string]
  clear: []
}>()
</script>

<template>
  <FilterToolbar
    :search="search"
    placeholder="Search systems, IDs, annotations... (/)"
    :has-active-filters="hasActiveFilters"
    @update:search="(v) => emit('update:search', v)"
    @clear="emit('clear')"
  >
    <FilterChipGroup
      label="Kind"
      :items="kinds"
      :active="activeKinds"
      @toggle="(kind) => emit('toggle-kind', kind)"
    />
    <FilterChipGroup
      label="Context"
      :items="contexts"
      :active="activeContexts"
      @toggle="(id) => emit('toggle-context', id)"
    />
  </FilterToolbar>
</template>
