<script setup lang="ts">
import { IconBookmark, IconBookmarkFilled } from '@tabler/icons-vue'

withDefaults(
  defineProps<{
    active: boolean
    size?: number
    name?: string
  }>(),
  { size: 14, name: 'this' },
)

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    type="button"
    data-favorite-toggle
    class="shrink-0 rounded p-0.5 transition-colors"
    :class="
      active ? 'text-accent hover:text-accent-text' : 'text-text-4 hover:bg-bg-3 hover:text-text-2'
    "
    :aria-pressed="active"
    :title="active ? `Remove ${name} from favorites` : `Add ${name} to favorites`"
    @click.stop="emit('toggle')"
  >
    <component
      :is="active ? IconBookmarkFilled : IconBookmark"
      :size="size"
      :stroke-width="2"
    />
  </button>
</template>
