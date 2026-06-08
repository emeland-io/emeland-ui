<script setup lang="ts">
import { IconSearch, IconLogout } from '@tabler/icons-vue'
import { clearToken, authenticated } from '@/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  clearToken()
  router.push('/')
}
</script>

<template>
  <header class="flex h-10 items-center border-b border-border-1 bg-bg-1 px-4">
    <div class="text-[13px] font-medium">
      <span class="text-accent">EmE</span>
      <span class="text-text-1">Land</span>
    </div>

    <div class="flex-1" />

    <div class="flex w-64 items-center gap-2 rounded border border-border-1 bg-bg-1 px-2.5 py-1 text-[11px]">
      <IconSearch :size="12" :stroke-width="1.5" class="shrink-0 text-text-4" aria-hidden="true" />
      <input
type="text" placeholder="Search Findings, Resources, Events, ..."
        class="w-full bg-transparent text-text-2 placeholder:text-text-4 outline-none" />
    </div>

    <button
v-if="authenticated" class="ml-3 flex items-center gap-1 rounded px-2 py-1 text-[11px] text-text-3 hover:bg-bg-2 hover:text-text-1"
      title="Logout"
      @click="logout">
      <IconLogout :size="14" :stroke-width="1.5" />
    </button>
  </header>
</template>
