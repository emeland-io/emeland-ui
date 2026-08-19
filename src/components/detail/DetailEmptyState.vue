<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="flex flex-1 items-center justify-center">
    <span class="font-mono text-label text-text-4">{{ label }}</span>
  </div>
</template>
