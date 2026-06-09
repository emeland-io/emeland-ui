<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { handleCallback } from '@/auth'

const router = useRouter()

onMounted(async () => {
  const returnPath = await handleCallback()
  if (returnPath) {
    router.replace(returnPath)
  } else {
    router.replace('/login-failed')
  }
})
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <p class="text-sm text-text-3">Completing login…</p>
  </div>
</template>
