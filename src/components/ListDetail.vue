<script setup lang="ts">
import {
  useResizable,
  RESIZABLE_INITIAL_SIZE,
  RESIZABLE_MIN_SIZE,
  RESIZABLE_MAX_SIZE,
} from '@/composables/useResizable'

const props = withDefaults(
  defineProps<{
    initialWidth?: number
    minWidth?: number
    maxWidth?: number
  }>(),
  {
    initialWidth: RESIZABLE_INITIAL_SIZE,
    minWidth: RESIZABLE_MIN_SIZE,
    maxWidth: RESIZABLE_MAX_SIZE,
  },
)

const { width, isResizing, onResizeStart } = useResizable({
  initial: props.initialWidth,
  min: props.minWidth,
  max: props.maxWidth,
})

// Exposed so a parent can react to the drag state 
defineExpose({ isResizing })
</script>

<template>
  <div
    class="flex flex-1 overflow-hidden"
    :class="isResizing ? 'select-none' : ''"
  >
    <!-- List -->
    <div
      class="shrink-0 overflow-y-auto"
      :style="{ width: width + 'px' }"
    >
      <slot name="list" />
    </div>

    <!-- Resize handle -->
    <div
      class="w-0.5 shrink-0 cursor-col-resize transition-colors hover:bg-accent/40"
      :class="isResizing ? 'bg-accent/60' : 'bg-bg-3'"
      @mousedown.prevent="onResizeStart"
    />

    <!-- Detail -->
    <div class="flex flex-1 overflow-hidden">
      <slot name="detail" />
    </div>
  </div>
</template>
