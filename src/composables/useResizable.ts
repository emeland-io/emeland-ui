import { ref, onUnmounted } from 'vue'
import { trackMouseDrag } from '@/utils/dom'
import { safeStorage } from '@/utils/storage'

export const RESIZABLE_INITIAL_SIZE = 320
export const RESIZABLE_MIN_SIZE = 220
export const RESIZABLE_MAX_SIZE = 600

export interface ResizableOptions {
  initial?: number
  min?: number
  max?: number
  axis?: 'x' | 'y'
  inverted?: boolean
  storageKey?: string
}

export function useResizable(options: ResizableOptions = {}) {
  const {
    initial = RESIZABLE_INITIAL_SIZE,
    min = RESIZABLE_MIN_SIZE,
    max = RESIZABLE_MAX_SIZE,
    axis = 'x',
    inverted = false,
    storageKey,
  } = options

  const stored = storageKey ? Number(safeStorage()?.getItem(storageKey)) : NaN
  const width = ref(
    Number.isFinite(stored) && stored > 0 ? Math.max(min, Math.min(max, stored)) : initial,
  )
  const isResizing = ref(false)
  let cleanup: (() => void) | null = null

  function onResizeStart(e: MouseEvent) {
    isResizing.value = true
    const start = axis === 'x' ? e.clientX : e.clientY
    const startWidth = width.value

    cleanup = trackMouseDrag(
      (ev) => {
        const current = axis === 'x' ? ev.clientX : ev.clientY
        const delta = inverted ? start - current : current - start
        width.value = Math.max(min, Math.min(max, startWidth + delta))
      },
      () => {
        isResizing.value = false
        cleanup = null
        if (storageKey) safeStorage()?.setItem(storageKey, String(width.value))
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
