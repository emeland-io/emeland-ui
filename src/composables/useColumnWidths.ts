import { computed, ref, onUnmounted } from 'vue'
import { trackMouseDrag } from '@/utils/dom'
import { safeStorage } from '@/utils/storage'

export interface ColumnWidthSpec<K extends string> {
  key: K
  width?: number
  min?: number
}

export const COLUMN_MIN_WIDTH = 64

export function useColumnWidths<K extends string>(
  columns: readonly ColumnWidthSpec<K>[],
  options: { storageKey?: string } = {},
) {
  const defaults = Object.fromEntries(columns.map((c) => [c.key, c.width])) as Record<
    K,
    number | undefined
  >
  const mins = Object.fromEntries(columns.map((c) => [c.key, c.min ?? COLUMN_MIN_WIDTH])) as Record<
    K,
    number
  >

  function readStored(): Partial<Record<K, number>> {
    const raw = options.storageKey ? safeStorage()?.getItem(options.storageKey) : null
    if (!raw) return {}
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return {}
      const out: Partial<Record<K, number>> = {}
      for (const c of columns) {
        const v = (parsed as Record<string, unknown>)[c.key]
        if (typeof v === 'number' && Number.isFinite(v) && v > 0)
          out[c.key] = Math.max(mins[c.key], v)
      }
      return out
    } catch {
      return {}
    }
  }

  const widths = ref<Record<K, number | undefined>>({ ...defaults, ...readStored() })
  const isResizing = ref(false)
  let cleanup: (() => void) | null = null

  function persist() {
    if (!options.storageKey) return
    const set: Partial<Record<K, number>> = {}
    for (const c of columns) {
      const w = widths.value[c.key]
      if (w !== undefined) set[c.key] = w
    }
    safeStorage()?.setItem(options.storageKey, JSON.stringify(set))
  }

  /**
   * Start dragging the right edge of `key`. The start width is the column's
   * fixed width, or the rendered width of the handle's header cell when the
   * column is still auto.
   */
  function onResizeStart(key: K, e: MouseEvent) {
    const cell = (e.currentTarget as HTMLElement | null)?.closest('th,td')
    const startWidth = widths.value[key] ?? cell?.getBoundingClientRect().width ?? mins[key]
    const startX = e.clientX
    isResizing.value = true
    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    cleanup = trackMouseDrag(
      (ev) => {
        widths.value[key] = Math.max(mins[key], Math.round(startWidth + (ev.clientX - startX)))
      },
      () => {
        isResizing.value = false
        cleanup = null
        document.body.style.userSelect = previousUserSelect
        document.body.style.cursor = ''
        persist()
      },
    )
  }

  function reset(key: K) {
    widths.value[key] = defaults[key]
    persist()
  }

  function colStyle(key: K): { width: string } | undefined {
    const w = widths.value[key]
    return w === undefined ? undefined : { width: `${w}px` }
  }

  /** true while at least one column still takes the remaining space */
  const hasAuto = computed(() => columns.some((c) => widths.value[c.key] === undefined))

  /**
   * Smallest table width that honours every column: fixed columns count with
   * their width, auto columns with their minimum. Below that the table should
   * scroll rather than crush the auto column.
   */
  const minTotalWidth = computed(() =>
    columns.reduce((sum, c) => sum + (widths.value[c.key] ?? mins[c.key]), 0),
  )

  onUnmounted(() => cleanup?.())

  return { widths, isResizing, onResizeStart, reset, colStyle, hasAuto, minTotalWidth }
}
