<script setup lang="ts">
import { IconArrowUpRight } from '@tabler/icons-vue'
import CopyButton from '@/components/CopyButton.vue'
import TypeTag from '@/components/TypeTag.vue'

/**
 * Stacked related-resource card in the detail panes:
 *   [badge] name
 *   id
 * Renders as a navigable button when `clickable` (the default); pass
 * `clickable: false` for unresolved references shown as static rows
 */
withDefaults(
  defineProps<{
    name: string
    id: string
    /** uppercase tag; omit for tag-less rows */
    badge?: string
    /** muted badge tone (e.g. abstract systems) instead of accent */
    badgeMuted?: boolean
    /** error badge tone for unresolved references */
    badgeError?: boolean
    nameError?: boolean
    clickable?: boolean
    /** show the copy button next to the id */
    copyable?: boolean
    /** right-align the arrow (used by badge-less rows) */
    arrowEnd?: boolean
    title?: string
  }>(),
  {
    badge: undefined,
    badgeMuted: false,
    badgeError: false,
    nameError: false,
    clickable: true,
    copyable: true,
    arrowEnd: false,
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
    class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
    :title="clickable ? title : undefined"
    @click="clickable && emit('click')"
  >
    <span class="group/row flex w-full items-center gap-3">
      <TypeTag
        v-if="badge"
        :tone="badgeError ? 'error' : badgeMuted ? 'muted' : 'accent'"
      >
        {{ badge }}
      </TypeTag>
      <span
        class="min-w-0 truncate text-body transition-colors"
        :class="[
          nameError ? 'text-error' : 'text-text-2',
          clickable ? 'group-hover/row:text-accent' : '',
        ]"
      >
        {{ name }}
      </span>
      <slot name="trailing" />
      <IconArrowUpRight
        v-if="clickable"
        :size="16"
        :stroke-width="2"
        class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
        :class="arrowEnd ? 'ml-auto' : ''"
      />
    </span>
    <span class="flex items-center gap-1.5">
      <slot name="subline">
        <span class="font-mono text-meta text-text-4">{{ id }}</span>
        <CopyButton
          v-if="copyable"
          :value="id"
          :size="12"
          @click.stop
        />
      </slot>
    </span>
  </component>
</template>
