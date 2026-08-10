<script setup lang="ts">
import { computed } from 'vue'
import type { NavItem } from '@/composables/useNavigation'
import { useSidebarNav } from '@/composables/useSidebarNav'
import { useSidebarWidth } from '@/composables/useSidebarWidth'
import { useSidebarHover } from '@/composables/useSidebarHover'
import TypeChip from '@/components/TypeChip.vue'

const props = defineProps<{
  item: NavItem
}>()

const { active, cursorRoute } = useSidebarNav()
const { collapsed } = useSidebarWidth()
const { setHovered } = useSidebarHover()
const isCursor = computed(() => active.value && cursorRoute.value === props.item.route)

function onEnter() {
  if (collapsed.value) setHovered(props.item.route)
}
function onLeave() {
  setHovered(null)
}
</script>

<template>
  <router-link
    :to="item.route"
    :data-nav-route="item.route"
    class="group flex items-center border-l-2 text-meta font-medium outline-none transition-colors"
    :class="[
      collapsed ? 'h-7 justify-center pr-0.5' : 'gap-2 px-3 py-1.5',
      isCursor
        ? 'border-l-text-3 bg-bg-3 text-text-1'
        : 'border-transparent text-text-2 hover:bg-bg-2',
    ]"
    active-class="active-nav"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <span class="relative flex shrink-0">
      <TypeChip
        :type="item.type"
        :letter="item.chip"
        :label="item.label"
        class="group-[.active-nav]:bg-accent/15 group-[.active-nav]:text-accent-text"
      />
      <span
        v-if="collapsed && typeof item.badge === 'number'"
        class="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-warning ring-2 ring-bg-1"
      />
    </span>
    <template v-if="!collapsed">
      <span class="flex-1 truncate group-[.active-nav]:text-accent-text">{{ item.label }}</span>
      <span
        v-if="typeof item.badge === 'number'"
        class="rounded-full bg-warning/10 px-1.5 font-mono text-meta text-warning ring-1 ring-warning/25"
      >
        {{ item.badge }}
      </span>
    </template>
  </router-link>
</template>

<style scoped>
.active-nav {
  border-left-color: var(--color-accent);
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent-text);
}
</style>
