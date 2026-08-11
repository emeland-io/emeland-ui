<script setup lang="ts">
import type { NavSection } from '@/composables/useNavigation'
import SidebarNavItem from '@/components/SidebarNavItem.vue'
import { useSidebarWidth } from '@/composables/useSidebarWidth'

defineProps<{
  section: NavSection
  /** first section of its block — no separator above it */
  first?: boolean
}>()

const { collapsed } = useSidebarWidth()
</script>

<template>
  <div :class="collapsed ? 'pt-2 first:pt-0' : ''">
    <div
      v-if="collapsed && !section.phase && !first"
      class="mx-3 mb-2 border-t border-border-1"
    />
    <div
      v-if="collapsed && section.phase"
      class="pb-1 text-center font-mono text-micro font-semibold leading-none tracking-[0.08em] text-text-4"
      :title="section.title"
    >
      {{ section.phase }}
    </div>
    <div
      v-if="!collapsed"
      class="flex items-baseline px-3.5 pb-1 text-meta font-mono font-semibold uppercase tracking-[0.1em] text-text-4"
      :class="first ? 'pt-0' : 'pt-2.5'"
    >
      <span class="truncate">{{ section.title }}</span>
      <span
        v-if="section.phase"
        class="ml-auto pl-2 text-meta font-mono font-semibold uppercase tracking-[0.1em] text-text-4"
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
