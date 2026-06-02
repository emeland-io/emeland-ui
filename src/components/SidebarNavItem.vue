<script setup lang="ts">
import type { NavItem } from '@/layouts/navigation'

defineProps<{
  item: NavItem
}>()
</script>

<template>
  <router-link
    :to="item.route"
    class="group flex items-center gap-2 border-l-2 border-transparent px-3 py-1.5 text-[11px] font-medium text-text-2 transition-colors hover:bg-bg-3"
    active-class="active-nav"
  >
    <component
      :is="item.icon"
      :size="14"
      :stroke-width="1.5"
      class="shrink-0 text-text-3 group-[.active-nav]:text-accent-text"
    />
    <span class="flex-1 group-[.active-nav]:text-accent-text">{{ item.label }}</span>
    <span
      v-if="item.badge === 'dot'"
      class="h-1.5 w-1.5 rounded-full bg-error"
    />
    <span
      v-else-if="typeof item.badge === 'number'"
      class="rounded-full bg-bg-2 px-1.5 font-mono text-[9px] text-text-3"
    >
      {{ item.badge }}
    </span>
  </router-link>
</template>

<style scoped>
.active-nav {
  border-left-color: var(--color-accent);
  background-color: rgba(29, 158, 117, 0.08);
  color: var(--color-accent-text);
}
</style>
