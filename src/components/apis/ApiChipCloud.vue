<script setup lang="ts">
import { IconArrowUp, IconArrowDown } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'

/**
 * Cloud of API reference chips (provides/consumes). Known APIs render as
 * buttons; references to missing APIs stay static
 *
 * `direction` adds the up/down arrow used by the instance drawers; `markRelations` tags clickable
 * chips with data-drawer-relation for drawer keyboard navigation
 */
const props = withDefaults(
  defineProps<{
    apis: { id: string; name: string }[]
    tone?: 'accent' | 'muted'
    direction?: 'up' | 'down'
    size?: 'meta' | 'label'
    markRelations?: boolean
  }>(),
  { tone: 'accent', direction: undefined, size: 'label', markRelations: false },
)

const emit = defineEmits<{
  open: [id: string]
}>()

const apiStore = useApiStore()

function known(id: string): boolean {
  return apiStore.apiMap.has(id)
}
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <component
      :is="known(api.id) ? 'button' : 'span'"
      v-for="api in props.apis"
      :key="api.id"
      class="rounded font-mono transition-colors"
      :class="[
        direction ? 'flex items-center gap-1' : '',
        size === 'meta' ? 'px-1.5 py-0.5 text-meta' : 'px-2 py-0.5 text-label',
        tone === 'accent' ? 'bg-accent/10 text-accent-text' : 'bg-bg-2 text-text-3',
        known(api.id)
          ? tone === 'accent'
            ? 'hover:bg-accent/20 focus-visible:bg-accent/20 focus-visible:outline-none'
            : 'hover:bg-bg-3 hover:text-text-1 focus-visible:bg-bg-3 focus-visible:text-text-1 focus-visible:outline-none'
          : '',
      ]"
      :title="known(api.id) ? `Go to API — ${api.id}` : api.id"
      :data-drawer-relation="markRelations && known(api.id) ? '' : undefined"
      @click="known(api.id) && emit('open', api.id)"
    >
      <component
        :is="direction === 'up' ? IconArrowUp : IconArrowDown"
        v-if="direction"
        :size="11"
        :stroke-width="2"
      />
      {{ api.name }}
    </component>
  </div>
</template>
