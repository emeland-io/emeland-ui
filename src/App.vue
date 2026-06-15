<script setup lang="ts">
import BaseLayout from './layouts/BaseLayout.vue'
import { useFindingsStore } from './stores/findings'

// preloads
const findingsStore = useFindingsStore()
findingsStore.load()
</script>

<template>
  <BaseLayout />
</template>
