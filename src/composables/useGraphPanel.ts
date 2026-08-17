import { nextTick, reactive, ref, watch, type Ref } from 'vue'
import { useResizable } from './useResizable'

/** Imperative surface every GraphPane component exposes via defineExpose */
export interface GraphPaneHandle {
  fit: () => void
  focusSelected: () => void
  focusMatches: () => void
  zoomIn: () => void
  zoomOut: () => void
}

/** Below this height a drag snaps the graph closed */
const SNAP_CLOSE = 100
const DEFAULT_HEIGHT = 320

export interface GraphPanelOptions {
  /** Template ref of the graph pane so the panel can drive fit/zoom/focus */
  pane: Ref<GraphPaneHandle | null>
  /** When search matches change, the graph refocuses onto them */
  matchIds?: Ref<Set<string>>
}

/**
 * Shared state and behaviour of the resizable graph strip that sits above the
 * detail pane: visibility, fullscreen, drag-resize with snap-close and refit
 * after layout changes. Rendered by `GraphPanel.vue`
 */
export function useGraphPanel({ pane, matchIds }: GraphPanelOptions) {
  const visible = ref(true)
  const fullscreen = ref(false)

  const {
    size: height,
    isResizing,
    onResizeStart,
  } = useResizable({ initial: DEFAULT_HEIGHT, min: 48, max: 700, axis: 'y' })

  function refit() {
    if (!visible.value) return
    nextTick(() => requestAnimationFrame(() => pane.value?.fit()))
  }

  function toggleGraph() {
    visible.value = !visible.value
    if (!visible.value) {
      fullscreen.value = false
      return
    }
    if (height.value < SNAP_CLOSE) height.value = DEFAULT_HEIGHT
    refit()
  }

  function toggleFullscreen() {
    fullscreen.value = !fullscreen.value
    if (fullscreen.value) visible.value = true
  }

  function onHandleDown(e: MouseEvent) {
    if (!visible.value) height.value = SNAP_CLOSE
    onResizeStart(e)
  }

  watch(height, (h) => {
    if (!isResizing.value) return
    visible.value = h >= SNAP_CLOSE
  })

  watch(isResizing, (resizing) => {
    if (!resizing) refit()
  })

  if (matchIds) {
    watch(matchIds, (ids) => {
      if (ids.size === 0) return
      nextTick(() => pane.value?.focusMatches())
    })
  }

  return reactive({
    visible,
    fullscreen,
    height,
    isResizing,
    refit,
    toggleGraph,
    toggleFullscreen,
    onHandleDown,
    fit: () => pane.value?.fit(),
    focusSelected: () => pane.value?.focusSelected(),
    zoomIn: () => pane.value?.zoomIn(),
    zoomOut: () => pane.value?.zoomOut(),
  })
}

export type GraphPanelState = ReturnType<typeof useGraphPanel>
