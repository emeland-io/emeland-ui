<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import {
  IconSettings,
  IconBook,
  IconLogout,
  IconDeviceDesktop,
  IconSun,
  IconMoon,
  IconKeyboard,
} from '@tabler/icons-vue'
import { clearToken, authenticated } from '@/auth'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import { useShortcutsHelp } from '@/composables/useShortcutsHelp'
import { useSidebarWidth } from '@/composables/useSidebarWidth'
import ModelBadge from '@/components/ModelBadge.vue'
import BrandMark from '@/components/BrandMark.vue'

const router = useRouter()
const { width: sidebarWidth, collapsed, isResizing } = useSidebarWidth()
const { theme, setTheme } = useTheme()
const { toggle: toggleShortcuts } = useShortcutsHelp()

const THEME_MODES: { value: ThemeMode; icon: typeof IconSun; label: string }[] = [
  { value: 'system', icon: IconDeviceDesktop, label: 'System theme' },
  { value: 'light', icon: IconSun, label: 'Light theme' },
  { value: 'dark', icon: IconMoon, label: 'Dark theme' },
]

function logout() {
  clearToken()
  router.push('/')
}
</script>

<template>
  <header class="flex h-10 items-center gap-3 border-b border-border-1 bg-bg-1 pr-4">
    <div
      class="flex shrink-0 items-center overflow-hidden text-data font-medium text-text-2"
      :class="[
        collapsed ? 'justify-center px-0' : 'px-4',
        isResizing ? '' : 'transition-[width] duration-150 ease-out',
      ]"
      :style="{ width: sidebarWidth + 'px' }"
      :title="collapsed ? 'EmELand' : undefined"
    >
      <BrandMark
        :size="17"
        class="shrink-0"
        aria-label="EmELand"
      />
      <span
        v-if="!collapsed"
        class="ml-2 truncate"
      >
        EmELand
      </span>
    </div>

    <ModelBadge />

    <div class="flex-1" />
    <!-- Theme switcher (segmented) -->
    <div class="flex items-center gap-0.5 rounded-md border border-border-1 bg-bg-0 p-0.5">
      <button
        v-for="m in THEME_MODES"
        :key="m.value"
        class="flex h-6 w-6 items-center justify-center rounded transition-colors"
        :class="theme === m.value ? 'bg-bg-3 text-text-1' : 'text-text-4 hover:text-text-2'"
        :title="m.label"
        :aria-label="m.label"
        :aria-pressed="theme === m.value"
        @click="setTheme(m.value)"
      >
        <component
          :is="m.icon"
          :size="13"
          :stroke-width="1.75"
        />
      </button>
    </div>

    <!-- Keyboard shortcuts -->
    <button
      class="flex h-7 w-7 items-center justify-center rounded text-text-3 transition-colors hover:bg-bg-3 hover:text-text-2"
      title="Keyboard shortcuts (?)"
      aria-label="Keyboard shortcuts"
      @click="toggleShortcuts"
    >
      <IconKeyboard
        :size="15"
        :stroke-width="1.5"
      />
    </button>

    <!-- Settings -->
    <RouterLink
      :to="{ name: 'Settings' }"
      class="flex h-7 w-7 items-center justify-center rounded text-text-3 transition-colors hover:bg-bg-3 hover:text-text-2"
      title="Settings"
      aria-label="Settings"
    >
      <IconSettings
        :size="15"
        :stroke-width="1.5"
      />
    </RouterLink>

    <!-- Manual -->
    <a
      href="https://emeland.io/docs/introduction/"
      target="_blank"
      rel="noopener noreferrer"
      class="flex h-7 w-7 items-center justify-center rounded text-text-3 transition-colors hover:bg-bg-3 hover:text-text-2"
      title="EmELand Book"
      aria-label="Book (opens emeland.io)"
    >
      <IconBook
        :size="15"
        :stroke-width="1.5"
      />
    </a>

    <!-- Logout -->
    <button
      v-if="authenticated"
      class="flex h-7 w-7 items-center justify-center rounded text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
      title="Logout"
      aria-label="Logout"
      @click="logout"
    >
      <IconLogout
        :size="15"
        :stroke-width="1.5"
      />
    </button>
  </header>
</template>
