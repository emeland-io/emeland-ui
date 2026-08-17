<script setup lang="ts">
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconBinaryTree,
  IconFocusCentered,
  IconZoomIn,
  IconZoomOut,
  IconZoomScan,
} from '@tabler/icons-vue'
import { GRAPH_TOGGLE_KEYS, keyHint } from '@/constants/shortcuts'
import type { GraphPanelState } from '@/composables/useGraphPanel'

withDefaults(
  defineProps<{
    panel: GraphPanelState
    /** enables the focus-selection button */
    canFocus?: boolean
  }>(),
  { canFocus: false },
)
</script>

<template>
  <!-- Graph toolbar -->
  <div
    class="grid h-9 shrink-0 cursor-pointer select-none grid-cols-[1fr_auto_1fr] items-center border-b border-border-1 bg-bg-1 px-2"
    :title="panel.visible ? 'Double-click to hide graph' : 'Double-click to show graph'"
    @dblclick="panel.toggleGraph()"
  >
    <span class="text-micro font-medium uppercase tracking-wider text-text-4">Graph</span>
    <div class="flex items-center gap-1">
      <template v-if="panel.visible">
        <button
          class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-3"
          title="Focus selection"
          :disabled="!canFocus"
          @click.stop="panel.focusSelected()"
          @dblclick.stop
        >
          <IconFocusCentered
            :size="14"
            :stroke-width="1.75"
          />
        </button>
        <button
          class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
          title="Fit to view (0) — Shift+click focuses an area"
          @click.stop="panel.fit()"
          @dblclick.stop
        >
          <IconZoomScan
            :size="14"
            :stroke-width="1.75"
          />
        </button>
        <button
          class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
          title="Zoom out (−)"
          @click.stop="panel.zoomOut()"
          @dblclick.stop
        >
          <IconZoomOut
            :size="14"
            :stroke-width="1.75"
          />
        </button>
        <button
          class="rounded p-1 text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
          title="Zoom in (+)"
          @click.stop="panel.zoomIn()"
          @dblclick.stop
        >
          <IconZoomIn
            :size="14"
            :stroke-width="1.75"
          />
        </button>
        <template v-if="$slots.layers">
          <div class="mx-0.5 h-4 w-px bg-bg-3" />
          <slot name="layers" />
        </template>
        <div class="mx-0.5 h-4 w-px bg-bg-3" />
        <button
          class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta transition-colors hover:bg-bg-3"
          :class="panel.fullscreen ? 'text-accent' : 'text-text-3 hover:text-text-1'"
          :title="`Toggle fullscreen graph ${keyHint(GRAPH_TOGGLE_KEYS.fullscreen)}`"
          @click.stop="panel.toggleFullscreen()"
          @dblclick.stop
        >
          <component
            :is="panel.fullscreen ? IconArrowsMinimize : IconArrowsMaximize"
            :size="14"
            :stroke-width="1.75"
          />
          {{ panel.fullscreen ? 'Exit full view' : 'Full view' }}
        </button>
      </template>
      <button
        class="flex items-center gap-1.5 rounded px-1.5 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
        :title="`Show or hide the graph ${keyHint(GRAPH_TOGGLE_KEYS.graph)}`"
        @click.stop="panel.toggleGraph()"
        @dblclick.stop
      >
        <IconBinaryTree
          :size="14"
          :stroke-width="1.75"
        />
        {{ panel.visible ? 'Hide graph' : 'Show graph' }}
      </button>
    </div>
    <span />
  </div>

  <!-- Graph -->
  <div
    v-show="panel.visible"
    class="relative overflow-hidden"
    :class="panel.fullscreen ? 'min-h-0 flex-1' : 'shrink-0'"
    :style="panel.fullscreen ? undefined : { height: panel.height + 'px' }"
  >
    <!-- A second way back out of full view -->
    <button
      v-if="panel.fullscreen"
      class="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded border border-border-1 bg-bg-1/90 px-2 py-1 text-meta text-text-3 transition-colors hover:bg-bg-2 hover:text-text-1"
      title="Back to the split layout"
      @click="panel.toggleFullscreen()"
    >
      <IconArrowsMinimize
        :size="14"
        :stroke-width="1.75"
      />
      Exit full view
    </button>
    <slot />
  </div>

  <div
    v-if="!panel.fullscreen"
    class="h-0.5 shrink-0 cursor-row-resize transition-colors hover:bg-accent/40"
    :class="panel.isResizing ? 'bg-accent/60' : 'bg-bg-3'"
    :title="panel.visible ? 'Drag to resize' : 'Drag to open the graph'"
    @mousedown.prevent="panel.onHandleDown"
  />
</template>
