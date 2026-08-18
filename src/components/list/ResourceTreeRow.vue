<script setup lang="ts">
import { IconChevronRight } from '@tabler/icons-vue'

const props = withDefaults(
  defineProps<{
    id: string
    title: string
    depth: number
    ancestors: string[]
    childCount: number
    selected: boolean
    collapsed: boolean
    activeRail?: string
    indent?: number
  }>(),
  { activeRail: '', indent: 26 },
)

const emit = defineEmits<{
  select: [id: string]
  'toggle-collapse': [id: string]
}>()

function railLeft(level: number): string {
  return `${16 + (level - 1) * props.indent + 7}px`
}
</script>

<template>
  <div
    :data-row-id="id"
    class="relative cursor-pointer border-b border-l-2 border-border-1 py-3 pr-4 transition-colors"
    :class="[
      selected ? 'border-l-accent bg-accent/5' : 'border-l-transparent hover:bg-bg-2',
      childCount > 0 && !selected ? 'bg-bg-1' : '',
    ]"
    :style="{ paddingLeft: `${16 + depth * indent}px` }"
    @click="emit('select', id)"
  >
    <span
      v-for="level in depth"
      :key="level"
      class="pointer-events-none absolute inset-y-0 w-px transition-colors"
      :class="activeRail && ancestors[level - 1] === activeRail ? 'bg-border-2' : 'bg-border-1/50'"
      :style="{ left: railLeft(level) }"
      aria-hidden="true"
    />

    <div class="flex items-center gap-2">
      <span
        class="min-w-0 flex-1 truncate text-body font-medium text-text-1"
        :title="title"
      >
        {{ title }}
      </span>
      <button
        v-if="childCount > 0"
        class="-mr-1 shrink-0 rounded p-0.5 text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
        :title="collapsed ? 'Expand' : 'Collapse'"
        @click.stop="emit('toggle-collapse', id)"
      >
        <IconChevronRight
          :size="14"
          :stroke-width="2"
          class="transition-transform"
          :class="collapsed ? '' : 'rotate-90'"
        />
      </button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <slot />
      <span class="ml-auto flex shrink-0 items-center gap-1.5">
        <slot name="badges" />
      </span>
    </div>
  </div>
</template>
