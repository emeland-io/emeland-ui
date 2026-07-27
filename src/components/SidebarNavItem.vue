<script setup lang="ts">
import type { NavItem } from '@/composables/useNavigation'

defineProps<{
  item: NavItem
}>()
</script>

<template>
  <router-link
    :to="item.route"
    class="group flex items-center gap-2 border-l-2 border-transparent px-3 py-1.5 text-meta font-medium text-text-2 transition-colors hover:bg-bg-3"
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
      v-if="typeof item.badge === 'number'"
      class="rounded-full bg-warning/10 px-1.5 font-mono text-meta text-warning ring-1 ring-warning/25"
    >
      {{ item.badge }}
    </span>
  </router-link>
</template>

<style scoped>
.active-nav {
  border-left-color: var(--color-accent);
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent-text);
}
</style>
