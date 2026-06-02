<script setup lang="ts">
import type { NavSection } from '@/layouts/navigation'
import SidebarNavItem from '@/components/SidebarNavItem.vue'

defineProps<{
  section: NavSection
}>()
</script>

<template>
  <div>
    <div
      class="flex items-baseline px-3.5 pb-1 pt-2.5 text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-text-4"
    >
      <span>{{ section.title }}</span>
      <span
        v-if="section.phase"
        class="ml-auto text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-text-4"
      >
        {{ section.phase }}
      </span>
    </div>
    <SidebarNavItem
      v-for="item in section.items"
      :key="item.route"
      :item="item"
    />
  </div>
</template>
