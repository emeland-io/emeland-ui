<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 24 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    role="img"
  >
    <path
      d="M1.5 19.5 7.6 7.8l6.1 11.7z"
      opacity=".6"
    />
    <path d="M8.6 19.5 15.4 4.5l7.1 15z" />
  </svg>
</template>
