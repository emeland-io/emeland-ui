<script setup lang="ts">
import { computed } from 'vue'
import { IconChevronRight } from '@tabler/icons-vue'

const props = withDefaults(
  defineProps<{
    /** rows currently shown */
    count: number
    /** rows before filtering; "n of N" appears when they differ */
    total: number
    /** pass to make the pane collapsible; omit for a static bar */
    collapsed?: boolean
  }>(),
  { collapsed: undefined },
)

const emit = defineEmits<{
  toggle: []
}>()

const collapsible = computed(() => props.collapsed !== undefined)
</script>

<template>
  <div
    class="flex h-9 shrink-0 items-center justify-between border-b border-border-1 bg-bg-1 px-2"
    :class="collapsible ? 'cursor-pointer select-none' : ''"
    :title="
      collapsible ? (collapsed ? 'Double-click to expand' : 'Double-click to collapse') : undefined
    "
    @dblclick="collapsible && emit('toggle')"
  >
    <span class="flex items-center gap-1.5">
      <span class="text-micro font-medium uppercase tracking-wider text-text-4">List</span>
      <span class="rounded-full bg-bg-2 px-2 py-0.5 font-mono text-micro tabular-nums text-text-3">
        {{ count }}
        <span
          v-if="count !== total"
          class="text-text-4"
        >
          of {{ total }}
        </span>
      </span>
    </span>
    <span class="flex items-center gap-0.5">
      <!-- extra buttons (e.g. collapse-all) -->
      <slot name="actions" />
      <button
        v-if="collapsible"
        class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
        :title="collapsed ? 'Expand' : 'Collapse'"
        @click.stop="emit('toggle')"
        @dblclick.stop
      >
        <IconChevronRight
          :size="14"
          :stroke-width="2"
          class="transition-transform"
          :class="collapsed ? '' : 'rotate-90'"
        />
      </button>
    </span>
  </div>
</template>
