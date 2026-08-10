import { computed, ref } from 'vue'

export const SIDEBAR_COLLAPSED_WIDTH = 52
export const SIDEBAR_DEFAULT_WIDTH = 176
export const SIDEBAR_SNAP_WIDTH = 132
export const SIDEBAR_MIN_WIDTH = 160
export const SIDEBAR_MAX_WIDTH = 240

const STORAGE_KEY = 'emeland-sidebar-width'

function readStored(): number {
  if (typeof localStorage === 'undefined') return SIDEBAR_DEFAULT_WIDTH
  const raw = Number(localStorage.getItem(STORAGE_KEY))
  if (!Number.isFinite(raw) || raw <= 0) return SIDEBAR_DEFAULT_WIDTH
  if (raw <= SIDEBAR_SNAP_WIDTH) return SIDEBAR_COLLAPSED_WIDTH
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, raw))
}

const width = ref(readStored())
const isResizing = ref(false)
const lastExpanded = ref(width.value > SIDEBAR_SNAP_WIDTH ? width.value : SIDEBAR_DEFAULT_WIDTH)

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, String(width.value))
}

const collapsed = computed(() => width.value <= SIDEBAR_SNAP_WIDTH)

function setWidth(next: number) {
  if (next <= SIDEBAR_SNAP_WIDTH) {
    width.value = SIDEBAR_COLLAPSED_WIDTH
  } else {
    width.value = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, next))
    lastExpanded.value = width.value
  }
}

export function useSidebarWidth() {
  function onResizeStart(e: MouseEvent) {
    isResizing.value = true
    const startX = e.clientX
    const startWidth = width.value
    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    function onMove(ev: MouseEvent) {
      setWidth(startWidth + (ev.clientX - startX))
    }
    function onUp() {
      isResizing.value = false
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      persist()
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function toggle() {
    setWidth(collapsed.value ? lastExpanded.value : SIDEBAR_COLLAPSED_WIDTH)
    persist()
  }

  return { width, collapsed, isResizing, onResizeStart, toggle }
}
