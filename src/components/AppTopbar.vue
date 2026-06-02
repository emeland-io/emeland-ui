<script setup lang="ts">
import { IconSearch } from '@tabler/icons-vue'
</script>

<template>
  <header class="flex h-10 items-center border-b border-border-1 bg-bg-1 px-4">
    <div class="text-[13px] font-medium">
      <span class="text-accent">EmE</span>
      <span class="text-text-1">Land</span>
    </div>

    <div class="flex-1" />

    <div
      class="flex w-64 items-center gap-2 rounded border border-border-1 bg-bg-1 px-2.5 py-1 text-[11px] text-text-4"
    >
      <IconSearch
        :size="12"
        :stroke-width="1.5"
        aria-hidden="true"
      />
      <span>Search Findings, Resources, Events, ...</span>
    </div>
  </header>
</template>
