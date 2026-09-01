<script setup lang="ts">
import SkeletonBlock from '@/components/view/SkeletonBlock.vue'
import { RESIZABLE_INITIAL_SIZE } from '@/composables/useResizable'

/**
 * Loading placeholder mirroring the ListDetail layout
 */
withDefaults(
  defineProps<{
    listWidth?: number
    rows?: number
    toolbar?: boolean
  }>(),
  {
    listWidth: RESIZABLE_INITIAL_SIZE,
    rows: 8,
    toolbar: true,
  },
)
</script>

<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <div
      v-if="toolbar"
      class="flex items-center gap-2 border-b border-border-1 px-4 py-2"
    >
      <SkeletonBlock class="h-6 w-48" />
      <SkeletonBlock class="h-6 w-16" />
      <SkeletonBlock class="h-6 w-16" />
    </div>
    <div class="flex flex-1 overflow-hidden">
      <!-- list pane -->
      <div
        class="shrink-0 overflow-hidden border-r border-border-1"
        :style="{ width: listWidth + 'px' }"
      >
        <div
          v-for="i in rows"
          :key="i"
          class="border-b border-border-1 px-4 py-3"
        >
          <SkeletonBlock class="h-4 w-2/3" />
          <SkeletonBlock class="mt-2 h-3 w-1/3" />
        </div>
      </div>
      <!-- detail pane -->
      <div class="flex-1 overflow-hidden p-6">
        <SkeletonBlock class="h-6 w-1/3" />
        <SkeletonBlock class="mt-3 h-3 w-1/2" />
        <SkeletonBlock class="mt-8 h-4 w-full" />
        <SkeletonBlock class="mt-2 h-4 w-5/6" />
        <SkeletonBlock class="mt-2 h-4 w-2/3" />
      </div>
    </div>
  </div>
</template>
