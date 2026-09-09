<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-3xl px-6 py-8">
      <h2 class="text-title font-medium text-text-1">General</h2>
      <p class="mt-2 text-body text-text-3">
        Application and environment information will appear here. For now, open
        <RouterLink
          to="/settings/annotations"
          class="text-accent-text underline-offset-2 hover:underline"
        >
          Annotations
        </RouterLink>
        to inspect the well-known annotation catalog.
      </p>
    </div>
  </div>
</template>
