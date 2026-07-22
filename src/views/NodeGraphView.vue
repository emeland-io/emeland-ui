<script setup lang="ts">
import { IconArrowsMaximize, IconPlus, IconMinus } from '@tabler/icons-vue'
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="relative flex-1 overflow-hidden">
      <div
        class="absolute inset-0"
        style="
          background-image: radial-gradient(rgba(80, 110, 100, 0.22) 1px, transparent 1px);
          background-size: 20px 20px;
        "
      />

      <div class="absolute bottom-3 left-3 flex items-center gap-1">
        <button
          class="flex h-7 w-7 items-center justify-center rounded border border-border-2 bg-bg-1 text-text-3 hover:bg-bg-2 hover:text-text-2"
        >
          <IconArrowsMaximize
            :size="14"
            :stroke-width="1.5"
          />
        </button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded border border-border-2 bg-bg-1 text-text-3 hover:bg-bg-2 hover:text-text-2"
        >
          <IconPlus
            :size="14"
            :stroke-width="1.5"
          />
        </button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded border border-border-2 bg-bg-1 text-text-3 hover:bg-bg-2 hover:text-text-2"
        >
          <IconMinus
            :size="14"
            :stroke-width="1.5"
          />
        </button>
      </div>
    </div>

    <div class="border-t border-border-1 bg-bg-1">
      <div
        class="flex items-center gap-2 border-b border-border-1 px-3 py-1.5 text-micro text-text-4"
      >
        <span class="font-mono">No node selected</span>
      </div>
      <div class="flex h-20 items-center justify-center">
        <span class="font-mono text-micro text-text-4">Select a node to inspect</span>
      </div>
    </div>
  </div>
</template>
