<script setup lang="ts">
import { IconAlertTriangle, IconInfoCircle, IconX } from '@tabler/icons-vue'
import { useToasts, type ToastTone } from '@/composables/useToasts'

const { toasts, dismiss } = useToasts()

const TONE_CLASSES: Record<ToastTone, { wrap: string; icon: string }> = {
  error: {
    wrap: 'border-error/20 bg-error/5 text-error',
    icon: 'text-error',
  },
  info: {
    wrap: 'border-accent/30 bg-accent/10 text-accent',
    icon: 'text-accent',
  },
  warning: {
    wrap: 'border-warning/20 bg-warning/10 text-warning',
    icon: 'text-warning',
  },
}
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :role="toast.tone === 'error' ? 'alert' : 'status'"
      class="pointer-events-auto flex items-start gap-2 rounded border px-3 py-2 shadow-lg"
      :class="TONE_CLASSES[toast.tone].wrap"
    >
      <component
        :is="toast.tone === 'info' ? IconInfoCircle : IconAlertTriangle"
        :size="14"
        :stroke-width="2"
        class="mt-0.5 shrink-0"
        :class="TONE_CLASSES[toast.tone].icon"
      />
      <div class="min-w-0 flex-1 break-words font-mono text-meta">{{ toast.message }}</div>
      <button
        class="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
        title="Dismiss"
        @click="dismiss(toast.id)"
      >
        <IconX
          :size="12"
          :stroke-width="2"
        />
      </button>
    </div>
  </div>
</template>
