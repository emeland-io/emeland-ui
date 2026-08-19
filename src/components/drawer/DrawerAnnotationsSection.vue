<script setup lang="ts">
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import type { Annotations } from '@/types/common'

defineProps<{
  annotations: Annotations
}>()
</script>

<template>
  <div v-if="Object.keys(annotations).length">
    <SectionLabel>Annotations</SectionLabel>
    <AnnotationsTable
      :annotations="annotations"
      columns="minmax(180px, 30%) minmax(0, 1fr)"
    />
  </div>
</template>
