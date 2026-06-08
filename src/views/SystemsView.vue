<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconBox } from '@tabler/icons-vue'
import { apiFetch } from '@/api/fetch'

interface SystemListItem {
  displayName: string
  instanceId: string
  reference: string
}

const systems = ref<SystemListItem[]>([])
const error = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const resp = await apiFetch('/api/landscape/systems')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    systems.value = await resp.json()
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
      <h1 class="text-sm font-medium text-text-1">Systems</h1>
      <span class="text-[10px] font-mono text-text-3">{{ systems.length }} items</span>
    </div>
    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <p class="text-sm text-text-3">Loading…</p>
    </div>
    <div v-else-if="error" class="flex flex-1 items-center justify-center">
      <p class="text-sm text-error">{{ error }}</p>
    </div>
    <div v-else-if="systems.length === 0" class="flex flex-1 items-center justify-center">
      <p class="text-sm text-text-3">No systems found</p>
    </div>
    <ul v-else class="flex-1 overflow-y-auto p-4">
      <li
        v-for="sys in systems"
        :key="sys.instanceId"
        class="flex items-center gap-3 rounded border border-border-2 bg-bg-1 px-3 py-2 mb-2"
      >
        <IconBox :size="16" :stroke-width="1.5" class="text-accent" />
        <div>
          <p class="text-sm font-medium text-text-1">{{ sys.displayName }}</p>
          <p class="text-[10px] font-mono text-text-4">{{ sys.instanceId }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
