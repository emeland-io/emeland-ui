<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string
    title: string
    selected: boolean
    compact?: boolean
  }>(),
  { compact: false },
)

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div
    :data-row-id="id"
    class="cursor-pointer border-b border-border-1 border-l-2 transition-colors"
    :class="[
      compact ? 'px-3 py-2' : 'px-4 py-3',
      selected ? 'border-l-accent bg-accent/5' : 'border-l-transparent hover:bg-bg-1',
    ]"
    @click="emit('select', id)"
  >
    <div class="flex items-center gap-1.5">
      <div
        class="min-w-0 flex-1 truncate text-body font-medium text-text-1"
        :title="title"
      >
        {{ title }}
      </div>
      <!-- Compact: badges sit on the title row (phase chips, row actions). -->
      <span
        v-if="compact && $slots.badges"
        class="flex shrink-0 items-center gap-1.5"
      >
        <slot name="badges" />
      </span>
    </div>
    <div
      v-if="$slots.default || (!compact && $slots.badges)"
      class="flex flex-wrap items-center gap-1.5"
      :class="compact ? 'mt-1' : 'mt-2'"
    >
      <slot />
      <span
        v-if="!compact"
        class="ml-auto flex shrink-0 items-center gap-1.5"
      >
        <slot name="badges" />
      </span>
    </div>
  </div>
</template>
