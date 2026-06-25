<script setup lang="ts">
import { onMounted } from 'vue'
import { useModelStore } from '@/stores/model'

const store = useModelStore()

const STATUS_DOT: Record<string, string> = {
  online: 'bg-accent',
  offline: 'bg-error',
  unknown: 'bg-text-4',
}

onMounted(() => store.load())
</script>

<template>
  <RouterLink
    v-if="store.model"
    :to="{ name: 'Model' }"
    class="flex items-center gap-2 rounded-md  px-2.5 py-1.5 transition-colors hover:bg-bg-2"
    title="Model details"
  >
    <span class="flex items-center gap-1.5">
      <span class="text-xs font-medium text-text-1">{{ store.model.displayName }}</span>
      <span
        v-if="store.model.version"
        class="font-mono text-[11px] text-text-4"
      >
        {{ store.model.version }}
      </span>
    </span>
    <span
      v-if="store.model.status"
      class="h-1.5 w-1.5 shrink-0 rounded-full"
      :class="STATUS_DOT[store.model.status]"
      :title="store.model.status"
    />
  </RouterLink>
</template>
