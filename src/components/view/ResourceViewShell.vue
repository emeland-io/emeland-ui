<script setup lang="ts">
import ListDetailSkeleton from '@/components/view/ListDetailSkeleton.vue'
import SkeletonShell from '@/components/view/SkeletonShell.vue'
import ErrorState from '@/components/view/ErrorState.vue'

/**
 * Outer shell of resource views: header slot on top, then the
 * loading/error gates around the main content slot. While loading, a
 * layout skeleton (overridable via the `skeleton` slot)
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
    <SkeletonShell
      v-if="loading"
      :label="loadingLabel"
    >
      <slot name="skeleton">
        <ListDetailSkeleton />
      </slot>
    </SkeletonShell>
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
