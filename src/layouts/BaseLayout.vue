<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import ShortcutsHelp from '@/components/ShortcutsHelp.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { useFocusSearch } from '@/composables/useFocusSearch'
import { useSidebarNav } from '@/composables/useSidebarNav'
import { useTabGuard } from '@/composables/useTabGuard'

useFocusSearch()
useSidebarNav()
useTabGuard()
</script>

<template>
  <div class="flex h-screen flex-col bg-bg-0 text-text-1">
    <AppTopbar />
    <div class="flex flex-1 overflow-hidden">
      <AppSidebar />
      <main class="flex-1 overflow-y-auto overflow-x-clip bg-bg-0">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>
    <ShortcutsHelp />
    <CommandPalette />
  </div>
</template>
