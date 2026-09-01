<script setup lang="ts">
defineProps<{
  /** the actual error message (store.detailErrorMessage), when available */
  message?: string
}>()
</script>

<template>
  <div class="flex items-start gap-2 rounded border border-error/20 bg-error/5 px-3 py-2">
    <div class="min-w-0">
      <div class="text-body text-error">Could not load full details</div>
      <div class="mt-0.5 font-mono text-meta text-error/80">
        Showing basic info only — the detail request failed.
      </div>
      <div
        v-if="message"
        class="mt-1 break-words font-mono text-meta text-error/60"
      >
        {{ message }}
      </div>
    </div>
  </div>
</template>
