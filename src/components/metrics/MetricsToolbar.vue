<script setup lang="ts">
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'

interface Chip {
  id: string
  name: string
  title?: string
}

defineProps<{
  search: string
  dimensions: string[]
  activeDimensions: Set<string>
  statuses: Chip[]
  activeStatuses: Set<string>
  subjectTypes: Chip[]
  activeSubjectTypes: Set<string>
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-dimension': [id: string]
  'toggle-status': [id: string]
  'toggle-subject-type': [id: string]
  clear: []
}>()
</script>

<template>
  <FilterToolbar
    :search="search"
    placeholder="Search metrics, instances, subjects, annotations... (/)"
    :has-active-filters="hasActiveFilters"
    @update:search="(v) => emit('update:search', v)"
    @clear="emit('clear')"
  >
    <FilterChipGroup
      v-if="dimensions.length > 0"
      label="Dimension"
      :items="dimensions"
      :active="activeDimensions"
      :visible-limit="4"
      @toggle="(id) => emit('toggle-dimension', id)"
    />
    <FilterChipGroup
      label="Status"
      :items="statuses"
      :active="activeStatuses"
      tone="warning"
      @toggle="(id) => emit('toggle-status', id)"
    />
    <FilterChipGroup
      v-if="subjectTypes.length > 0"
      label="Subject"
      :items="subjectTypes"
      :active="activeSubjectTypes"
      :visible-limit="4"
      @toggle="(id) => emit('toggle-subject-type', id)"
    />
  </FilterToolbar>
</template>
