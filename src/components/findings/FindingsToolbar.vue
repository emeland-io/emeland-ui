<script setup lang="ts">
import { computed } from 'vue'
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'

const props = defineProps<{
  search: string
  types: string[]
  resourceTypes: string[]
  activeTypes: Set<string>
  activeResourceTypes: Set<string>
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-type': [kind: string]
  'toggle-resource-type': [rt: string]
  clear: []
}>()

const hasActiveFilters = computed(
  () => !!props.search || props.activeTypes.size > 0 || props.activeResourceTypes.size > 0,
)
</script>

<template>
  <FilterToolbar
    :search="search"
    placeholder="Search summary, description, annotations... (/)"
    :has-active-filters="hasActiveFilters"
    @update:search="(v) => emit('update:search', v)"
    @clear="emit('clear')"
  >
    <FilterChipGroup
      label="Type"
      :items="types"
      :active="activeTypes"
      tone="warning"
      :visible-limit="3"
      @toggle="(kind) => emit('toggle-type', kind)"
    />
    <FilterChipGroup
      label="Resource"
      :items="resourceTypes"
      :active="activeResourceTypes"
      :visible-limit="3"
      @toggle="(rt) => emit('toggle-resource-type', rt)"
    />
  </FilterToolbar>
</template>
