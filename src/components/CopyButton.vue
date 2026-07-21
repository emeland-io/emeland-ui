<script setup lang="ts">
import { IconCopy, IconCheck } from '@tabler/icons-vue'
import { useClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  value: string
  size?: number
}>()

const { copy, isCopied } = useClipboard()
</script>

<template>
  <button
    class="group relative inline-flex shrink-0 items-center text-text-4 transition-colors hover:text-text-2"
    aria-label="Copy to clipboard"
    @click.stop="copy(props.value, props.value)"
  >
    <IconCheck
      v-if="isCopied(props.value)"
      :size="props.size ?? 14"
      :stroke-width="2"
      class="text-accent"
    />
    <IconCopy
      v-else
      :size="props.size ?? 14"
      :stroke-width="2"
    />

    <!-- Tooltip -->
    <span
      class="pointer-events-none absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-bg-3 px-2 py-1 font-mono text-micro text-text-2 opacity-0 transition-opacity"
      :class="isCopied(props.value) ? 'opacity-100' : 'group-hover:opacity-100'"
    >
      {{ isCopied(props.value) ? 'Copied!' : 'Copy' }}
    </span>
  </button>
</template>
