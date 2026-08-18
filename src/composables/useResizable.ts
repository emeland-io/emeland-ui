import { ref, onUnmounted } from 'vue'
import { trackMouseDrag } from '@/utils/dom'

export const RESIZABLE_INITIAL_SIZE = 320
export const RESIZABLE_MIN_SIZE = 220
export const RESIZABLE_MAX_SIZE = 600

export interface ResizableOptions {
  initial?: number
  min?: number
  max?: number
  axis?: 'x' | 'y'
}

export function useResizable(options: ResizableOptions = {}) {
  const {
    initial = RESIZABLE_INITIAL_SIZE,
    min = RESIZABLE_MIN_SIZE,
    max = RESIZABLE_MAX_SIZE,
    axis = 'x',
  } = options

  const width = ref(initial)
  const isResizing = ref(false)
  let cleanup: (() => void) | null = null

  function onResizeStart(e: MouseEvent) {
    isResizing.value = true
    const start = axis === 'x' ? e.clientX : e.clientY
    const startWidth = width.value

    cleanup = trackMouseDrag(
      (ev) => {
        const current = axis === 'x' ? ev.clientX : ev.clientY
        width.value = Math.max(min, Math.min(max, startWidth + (current - start)))
      },
      () => {
        isResizing.value = false
        cleanup = null
      },
    )
  }

  onUnmounted(() => cleanup?.())

  return {
    width,
    size: width,
    isResizing,
    onResizeStart,
  }
}
