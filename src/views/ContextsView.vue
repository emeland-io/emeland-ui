<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconSitemap } from '@tabler/icons-vue'
import { apiFetch } from '@/api/fetch'

interface ContextListItem {
  displayName: string
  instanceId: string
  reference: string
}

const contexts = ref<ContextListItem[]>([])
const error = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const resp = await apiFetch('/api/landscape/contexts')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    contexts.value = await resp.json()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-border-1 px-4 py-2.5">
      <h1 class="text-sm font-medium text-text-1">Contexts</h1>
      <span class="text-[10px] font-mono text-text-3">{{ contexts.length }} items</span>
    </div>
    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <p class="text-sm text-text-3">Loading…</p>
    </div>
    <div v-else-if="error" class="flex flex-1 items-center justify-center">
      <p class="text-sm text-error">{{ error }}</p>
    </div>
    <div v-else-if="contexts.length === 0" class="flex flex-1 items-center justify-center">
      <p class="text-sm text-text-3">No contexts found</p>
    </div>
    <ul v-else class="flex-1 overflow-y-auto p-4">
      <li
        v-for="ctx in contexts"
        :key="ctx.instanceId"
        class="flex items-center gap-3 rounded border border-border-2 bg-bg-1 px-3 py-2 mb-2"
      >
        <IconSitemap :size="16" :stroke-width="1.5" class="text-accent" />
        <div>
          <p class="text-sm font-medium text-text-1">{{ ctx.displayName }}</p>
          <p class="text-[10px] font-mono text-text-4">{{ ctx.instanceId }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
