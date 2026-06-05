<script setup lang="ts">
import { IconSettings, IconSun, IconMoon } from '@tabler/icons-vue'
import { headerNavigation, phaseNavigation } from '@/layouts/navigation'
import SidebarNavSection from '@/components/SidebarNavSection.vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <aside class="flex w-44 flex-col border-r border-border-1 bg-bg-1">
    <nav class="flex-1 overflow-y-auto pt-4">
      <SidebarNavSection
        v-for="section in headerNavigation"
        :key="section.title"
        :section="section"
      />

      <div class="mx-3.5 my-2 border-t border-border-1" />

      <SidebarNavSection
        v-for="section in phaseNavigation"
        :key="section.title"
        :section="section"
      />
    </nav>

    <div class="flex gap-2 px-3.5 py-2.5">
      <button
        class="flex h-7 w-7 items-center justify-center rounded text-text-3 transition-colors hover:bg-bg-3 hover:text-text-2"
      >
        <IconSettings
          :size="14"
          :stroke-width="1.5"
          aria-label="Settings"
        />
      </button>
      <button
        class="flex h-7 w-7 items-center justify-center rounded text-text-3 transition-colors hover:bg-bg-3 hover:text-text-2"
        @click="toggleTheme"
      >
        <IconSun
          v-if="theme === 'dark'"
          :size="14"
          :stroke-width="1.5"
          aria-label="Switch to light"
        />
        <IconMoon
          v-else
          :size="14"
          :stroke-width="1.5"
          aria-label="Switch to dark"
        />
      </button>
    </div>
  </aside>
</template>
