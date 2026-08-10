<script setup lang="ts">
import SidebarNavSection from '@/components/SidebarNavSection.vue'
import SidebarRailHint from '@/components/SidebarRailHint.vue'
import { useNavigation } from '@/composables/useNavigation'
import { useSidebarNav } from '@/composables/useSidebarNav'
import { useSidebarWidth } from '@/composables/useSidebarWidth'

const { headerNavigation, phaseNavigation } = useNavigation()
const { onFocusOut } = useSidebarNav()
const { width, collapsed, isResizing, onResizeStart, toggle } = useSidebarWidth()
</script>

<template>
  <aside
    class="relative flex shrink-0 flex-col border-r border-border-1 bg-bg-1"
    :class="isResizing ? '' : 'transition-[width] duration-150 ease-out'"
    :style="{ width: width + 'px' }"
  >
    <nav
      class="flex-1 overflow-y-auto overflow-x-hidden"
      :class="collapsed ? 'py-2' : 'pt-2 pb-4'"
      @focusout="onFocusOut"
    >
      <SidebarNavSection
        v-for="(section, i) in headerNavigation"
        :key="section.title"
        :section="section"
        :first="i === 0"
      />
      <div
        class="border-t border-border-1"
        :class="collapsed ? 'mx-2 my-1.5' : 'mx-3.5 my-2'"
      />
      <SidebarNavSection
        v-for="(section, i) in phaseNavigation"
        :key="section.title"
        :section="section"
        :first="i === 0"
      />
    </nav>

    <!-- Resize handle -->
    <div
      class="group/handle absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize"
      :title="
        collapsed
          ? 'Drag to expand (double-click, or Shift+B)'
          : 'Drag to resize (double-click to collapse, or Shift+B)'
      "
      @mousedown.prevent="onResizeStart"
      @dblclick="toggle"
    >
      <div
        class="ml-auto mr-1 h-full w-px transition-colors"
        :class="isResizing ? 'bg-accent' : 'bg-transparent group-hover/handle:bg-accent/50'"
      />
    </div>
    <SidebarRailHint />
  </aside>
</template>
