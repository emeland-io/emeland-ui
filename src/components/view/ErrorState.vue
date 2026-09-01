<script setup lang="ts">
defineProps<{
  message: string
  retryLabel?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-3">
    <p class="text-body text-error">{{ message }}</p>
    <button
      v-if="retryLabel"
      class="rounded bg-bg-2 px-3 py-1.5 text-meta text-text-2 transition-colors hover:bg-bg-3 hover:text-text-1"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
