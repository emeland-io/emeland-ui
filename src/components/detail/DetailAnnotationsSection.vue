<script setup lang="ts">
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import type { Annotations } from '@/types/common'

defineProps<{
  annotations: Annotations
}>()
</script>

<template>
  <div>
    <SectionLabel :count="Object.keys(annotations).length">Annotations</SectionLabel>
    <p
      v-if="Object.keys(annotations).length === 0"
      class="text-data leading-snug text-text-4"
    >
      No annotations.
    </p>
    <AnnotationsTable
      v-else
      :annotations="annotations"
      layout="stacked"
    />
  </div>
</template>
