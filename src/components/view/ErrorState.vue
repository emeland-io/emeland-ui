<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <div class="flex flex-1 items-center justify-center">
    <p class="text-body text-error">{{ message }}</p>
  </div>
</template>
