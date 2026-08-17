<script setup lang="ts">
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'

defineProps<{
  search: string
  systems: { id: string; name: string }[]
  activeSystems: Set<string>
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-system': [id: string]
  clear: []
}>()
</script>

<template>
  <FilterToolbar
    :search="search"
    placeholder="Search components, IDs, annotations... (/)"
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
  </FilterToolbar>
</template>
