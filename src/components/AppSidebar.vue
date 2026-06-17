<script setup lang="ts">
import SidebarNavSection from '@/components/SidebarNavSection.vue'
import { useNavigation } from '@/composables/useNavigation'

const { headerNavigation, phaseNavigation } = useNavigation()
</script>

<template>
  <aside class="flex w-44 flex-col border-r border-border-1 bg-bg-1">
    <nav class="flex-1 overflow-y-auto pt-4 pb-4">
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
  </aside>
</template>
