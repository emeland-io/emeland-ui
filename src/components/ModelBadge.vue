<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useModelStore } from '@/stores/model'
import { shouldDeferLoginRedirect } from '@/auth'

const store = useModelStore()
const route = useRoute()

// const STATUS_DOT: Record<string, string> = {
//   online: 'bg-accent',
//   offline: 'bg-error',
//   unknown: 'bg-text-4',
// }

// the topbar sits outside router-view and mounts once, so on /callback the load
// is deferred until the route leaves it rather than skipped for the session
watch(
  () => route.path,
  () => {
    if (!shouldDeferLoginRedirect()) store.load()
  },
  { immediate: true },
)
</script>

<template>
  <RouterLink
    v-if="store.model"
    :to="{ name: 'Model' }"
    class="flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors hover:bg-bg-2"
    title="Model details"
  >
    <span class="flex items-center gap-1.5">
      <span class="text-label font-medium text-text-1">{{ store.model.displayName }}</span>
      <span
        v-if="store.model.version"
        class="font-mono text-meta text-text-3"
      >
        {{ store.model.version }}
      </span>
    </span>
    <!-- <span
      v-if="store.model.status"
      class="h-1.5 w-1.5 shrink-0 rounded-full"
      :class="STATUS_DOT[store.model.status]"
      :title="store.model.status"
    /> -->
  </RouterLink>
</template>
