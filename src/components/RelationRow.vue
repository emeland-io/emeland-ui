<script setup lang="ts">
import { IconArrowUpRight } from '@tabler/icons-vue'
import CopyButton from '@/components/CopyButton.vue'
import TypeTag from '@/components/TypeTag.vue'

/**
 * A related-resource row in a drawer or detail pane: [badge] name  ... id
 * Renders as a navigable button when `clickable`, as a static div otherwise
 */
withDefaults(
  defineProps<{
    /** display name; use the error tone for unresolved references */
    name: string
    /** raw id shown on the right, also the copy value */
    id: string
    /** badge text; omitted = no badge (e.g. contexts without a type) */
    badge?: string
    badgeTone?: 'accent' | 'error'
    nameTone?: 'default' | 'error'
    clickable?: boolean
    title?: string
  }>(),
  {
    badge: undefined,
    badgeTone: 'accent',
    nameTone: 'default',
    clickable: false,
    title: undefined,
  },
)

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <component
    :is="clickable ? 'button' : 'div'"
    class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0 focus-visible:bg-bg-2 focus-visible:outline-none"
    :data-drawer-relation="clickable ? '' : undefined"
    :title="clickable ? title : undefined"
    @click="clickable && emit('click')"
  >
    <TypeTag
      v-if="badge"
      :tone="badgeTone"
    >
      {{ badge }}
    </TypeTag>
    <span
      class="max-w-full truncate text-body transition-colors"
      :class="[
        nameTone === 'error' ? 'text-error' : 'text-text-2',
        clickable ? 'group-hover:text-accent' : '',
      ]"
    >
      {{ name }}
    </span>
    <IconArrowUpRight
      v-if="clickable"
      :size="16"
      :stroke-width="2"
      class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
    />
    <div class="ml-auto flex shrink-0 items-center gap-1.5">
      <span class="font-mono text-meta text-text-4">{{ id }}</span>
      <CopyButton
        :value="id"
        :size="12"
        @click.stop
      />
    </div>
  </component>
</template>
