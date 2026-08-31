<script setup lang="ts">
import LoadingState from '@/components/view/LoadingState.vue'
import ErrorState from '@/components/view/ErrorState.vue'

/**
 * Outer shell of resource views: header slot on top, then the
 * loading/error gates around the main content slot
 */
defineProps<{
  loading: boolean
  loadingLabel: string
  error: string | null
  errorListEmpty: boolean
  retryLabel?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="relative flex h-full flex-col">
    <slot name="header" />
    <LoadingState
      v-if="loading"
      :label="loadingLabel"
    />
    <ErrorState
      v-else-if="error && errorListEmpty"
      :message="error"
      :retry-label="retryLabel"
      @retry="emit('retry')"
    />
    <template v-else>
      <slot />
    </template>
    <slot name="drawers" />
  </div>
</template>
