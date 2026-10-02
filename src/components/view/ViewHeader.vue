<script setup lang="ts">
defineProps<{
  title: string
  count?: number
}>()
</script>

<template>
  <div class="flex h-12 shrink-0 items-center gap-3 overflow-hidden border-b border-border-1 px-5">
    <div class="flex min-w-0 shrink items-center gap-3">
      <h1 class="truncate text-title font-medium text-text-1">{{ title }}</h1>
      <span
        v-if="count !== undefined"
        class="shrink-0 rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-label text-text-3"
      >
        {{ count }}
      </span>
      <!-- extra header stats -->
      <slot />
    </div>
    <!-- right-aligned actions -->
    <div class="flex min-w-0 flex-1 items-center justify-end">
      <slot name="actions" />
    </div>
  </div>
</template>
