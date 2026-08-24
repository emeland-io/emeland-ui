<script setup lang="ts">
defineProps<{
  title: string
  count?: number
}>()
</script>

<template>
  <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
    <div class="flex min-w-44 items-center gap-3">
      <h1 class="text-title font-medium text-text-1">{{ title }}</h1>
      <span
        v-if="count !== undefined"
        class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3"
      >
        {{ count }}
      </span>
      <!-- extra header stats -->
      <slot />
    </div>
    <!-- right-aligned actions -->
    <slot name="actions" />
  </div>
</template>
