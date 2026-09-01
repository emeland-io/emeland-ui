<script setup lang="ts">
import SkeletonBlock from '@/components/view/SkeletonBlock.vue'
import SkeletonShell from '@/components/view/SkeletonShell.vue'

/**
 * Placeholder for the graph area while the async graph pane chunk loads
 */
</script>

<template>
  <SkeletonShell label="Loading graph...">
    <div class="relative flex-1 overflow-hidden">
      <div class="sk-node absolute left-[8%] top-[16%] h-11 w-36 bg-bg-2 p-2">
        <SkeletonBlock class="h-2 w-1/2 bg-bg-3" />
        <SkeletonBlock class="mt-1.5 h-2 w-1/3 bg-bg-3" />
      </div>
      <div class="sk-node absolute left-[8%] top-[52%] h-11 w-36 bg-bg-2 p-2">
        <SkeletonBlock class="h-2 w-2/3 bg-bg-3" />
        <SkeletonBlock class="mt-1.5 h-2 w-1/3 bg-bg-3" />
      </div>
      <div class="sk-node absolute left-[42%] top-[10%] h-11 w-36 bg-bg-2 p-2">
        <SkeletonBlock class="h-2 w-1/2 bg-bg-3" />
        <SkeletonBlock class="mt-1.5 h-2 w-1/4 bg-bg-3" />
      </div>
      <div class="sk-node absolute left-[76%] top-[12%] h-11 w-36 bg-bg-1 p-2">
        <SkeletonBlock class="h-2 w-1/2 bg-bg-2" />
      </div>
      <div class="sk-node absolute left-[76%] top-[44%] h-11 w-36 bg-bg-1 p-2">
        <SkeletonBlock class="h-2 w-2/3 bg-bg-2" />
      </div>
      <div class="sk-node absolute left-[76%] top-[68%] h-11 w-36 bg-bg-1 p-2">
        <SkeletonBlock class="h-2 w-1/2 bg-bg-2" />
      </div>

      <div
        class="absolute inset-0 flex items-center justify-center font-mono text-label text-text-4"
      >
        Loading graph...
      </div>
    </div>
  </SkeletonShell>
</template>

<style scoped>
/* same cut-corner silhouette as the real component/instance graph nodes */
.sk-node {
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
  border-radius: 2px;
}
</style>
