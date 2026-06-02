<script setup lang="ts"></script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-border-1 px-4 py-2.5">
      <h1 class="text-sm font-medium text-text-1">Findings</h1>
      <div class="flex items-center gap-2 text-[10px] font-mono text-text-3">
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-error" />
          3 critical
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-warning" />
          7 warning
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-accent" />
          24 passed
        </span>
      </div>
    </div>
    <div class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <i class="ti ti-alert-circle text-3xl text-text-4" />
        <p class="mt-2 text-sm text-text-3">Findings view</p>
      </div>
    </div>
  </div>
</template>
