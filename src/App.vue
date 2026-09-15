<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseLayout from './layouts/BaseLayout.vue'
import { useFindingsStore } from './stores/findings'
import { shouldDeferLoginRedirect } from './auth'

// preloads — deferred rather than skipped on /callback, where a 401 would abort
// POST /auth/token. The root never remounts, so a skip would never retry.
const findingsStore = useFindingsStore()
const route = useRoute()

watch(
  () => route.path,
  () => {
    if (!shouldDeferLoginRedirect()) findingsStore.load()
  },
  { immediate: true },
)
</script>

<template>
  <BaseLayout />
</template>
