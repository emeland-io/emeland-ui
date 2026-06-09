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
      class="flex w-64 items-center gap-2 rounded border border-border-1 bg-bg-1 px-2.5 py-1 text-[11px]"
    >
      <IconSearch
        :size="12"
        :stroke-width="1.5"
        class="shrink-0 text-text-4"
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder="Search Findings, Resources, Events, ..."
        class="w-full bg-transparent text-text-2 placeholder:text-text-4 outline-none"
      />
    </div>
  </header>
</template>
