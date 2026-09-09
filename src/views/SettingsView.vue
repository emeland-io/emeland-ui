<script setup lang="ts">
import ViewHeader from '@/components/view/ViewHeader.vue'

/**
 * Settings shell: header + left subnav + nested subpages
 */
const subpages = [
  { label: 'General', route: '/settings' },
  { label: 'Annotations', route: '/settings/annotations' },
] as const
</script>

<template>
  <div class="flex h-full flex-col">
    <ViewHeader title="Settings" />

    <div class="flex flex-1 overflow-hidden">
      <!-- sub-navigation -->
      <nav
        class="flex w-40 shrink-0 flex-col gap-0.5 border-r border-border-1 px-2 py-3"
        aria-label="Settings sections"
      >
        <RouterLink
          v-for="page in subpages"
          :key="page.route"
          :to="page.route"
          class="rounded px-3 py-1.5 text-meta transition-colors"
          :class="
            $route.path === page.route
              ? 'bg-accent/10 font-medium text-accent-text'
              : 'text-text-3 hover:bg-bg-1 hover:text-text-1'
          "
        >
          {{ page.label }}
        </RouterLink>
      </nav>

      <!-- subpage -->
      <div class="flex min-w-0 flex-1 flex-col">
        <RouterView />
      </div>
    </div>
  </div>
</template>
