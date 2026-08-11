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
  <span
    role="button"
    tabindex="0"
    class="group/copy relative inline-flex shrink-0 cursor-pointer items-center rounded text-text-4 transition-colors hover:text-text-2 focus-visible:bg-bg-2 focus-visible:text-text-2 focus-visible:outline-none"
    aria-label="Copy to clipboard"
    @click.stop="copy(props.value, props.value)"
    @keydown.enter.stop.prevent="copy(props.value, props.value)"
    @keydown.space.stop.prevent="copy(props.value, props.value)"
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
      :class="isCopied(props.value) ? 'opacity-100' : 'group-hover/copy:opacity-100'"
    >
      {{ isCopied(props.value) ? 'Copied!' : 'Copy' }}
    </span>
  </span>
</template>
