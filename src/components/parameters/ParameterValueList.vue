<script setup lang="ts">
import { computed } from 'vue'
import { useParametersStore } from '@/stores/parameters'

export interface ParameterValuesEntry {
  parameterId: string
  values: string[]
}

const props = defineProps<{
  entries: ParameterValuesEntry[]
}>()

const parametersStore = useParametersStore()

const rows = computed(() =>
  props.entries.map((entry) => {
    const param = parametersStore.parameterMap.get(entry.parameterId)
    const flagged = entry.values.filter((v) => !!param?.values?.length && !param.values.includes(v))
    return {
      ...entry,
      name: param?.displayName ?? entry.parameterId,
      description: param?.description,
      unresolved: !param,
      flagged,
      validHint: param?.values?.length
        ? `Not among the parameter's valid values: ${param.values.join(', ')}`
        : undefined,
    }
  }),
)
</script>

<template>
  <div class="flex flex-col">
    <div
      v-for="row in rows"
      :key="row.parameterId"
      class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-1 py-1.5 last:border-b-0"
    >
      <span
        class="text-data"
        :class="row.unresolved ? 'text-error' : 'text-text-3'"
        :title="row.unresolved ? `Unresolved parameter ${row.parameterId}` : row.description"
      >
        {{ row.name }}
      </span>
      <span class="flex flex-wrap items-baseline justify-end gap-x-3 gap-y-0.5">
        <span
          v-for="value in row.values"
          :key="value"
          class="text-data"
          :class="row.flagged.includes(value) ? 'text-warning' : 'text-text-1'"
          :title="row.flagged.includes(value) ? row.validHint : undefined"
        >
          {{ value }}
        </span>
        <span
          v-if="row.flagged.length > 0"
          class="rounded bg-warning/10 px-1.5 py-0.5 text-micro text-warning"
          :title="row.validHint"
        >
          invalid value
        </span>
      </span>
    </div>
  </div>
</template>
