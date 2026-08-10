import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useNavigation } from '@/composables/useNavigation'
import { isEditableTarget } from '@/utils/dom'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { useModalSurfaces } from '@/composables/useModalSurfaces'

const ACTIVATE_KEY = 'b'

// shared across the layout (keys) and the sidebar items (cursor rendering)
const cursorIndex = ref(-1)

/**
 * Sidebar keyboard navigation: `b` focuses the sidebar with a cursor on the
 * current route's item, ↑/↓ walks all items (flattened across sections),
 * Enter navigates and leaves ("jump and work"), Esc leaves
 */
export function useSidebarNav() {
  const { headerNavigation, phaseNavigation } = useNavigation()
  const route = useRoute()
  const { anyModalOpen } = useModalSurfaces()

  const items = computed(() => {
    const flat: { route: string; label: string; section: string; phase?: string }[] = []
    for (const section of [...headerNavigation.value, ...phaseNavigation]) {
      for (const item of section.items)
        flat.push({
          route: item.route,
          label: item.label,
          section: section.title,
          phase: section.phase,
        })
    }
    return flat
  })

  const active = computed(() => cursorIndex.value >= 0)
  const cursorItem = computed(() => (active.value ? items.value[cursorIndex.value] : undefined))
  const cursorRoute = computed(() => cursorItem.value?.route)

  function linkOf(index: number): HTMLElement | undefined {
    const r = items.value[index]?.route
    if (!r) return undefined
    return [...document.querySelectorAll<HTMLElement>('[data-nav-route]')].find(
      (e) => e.dataset.navRoute === r,
    )
  }

  function activate() {
    const current = items.value.findIndex((i) => i.route === route.path)
    cursorIndex.value = current >= 0 ? current : 0
    linkOf(cursorIndex.value)?.focus()
  }

  function deactivate() {
    cursorIndex.value = -1
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  function move(step: -1 | 1) {
    const next = cursorIndex.value + step
    if (next < 0 || next >= items.value.length) return
    cursorIndex.value = next
    linkOf(next)?.focus()
  }

  function onKeydown(e: KeyboardEvent) {
    if (!active.value) {
      if (e.key.toLowerCase() !== ACTIVATE_KEY) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditableTarget(e.target)) return
      // never pull focus behind an open drawer/palette/help
      if (anyModalOpen.value) return
      e.preventDefault()
      e.stopImmediatePropagation()
      activate()
      return
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopImmediatePropagation()
      move(e.key === 'ArrowUp' ? -1 : 1)
    } else if (e.key === 'Enter') {
      e.preventDefault() // keep the focused link's native activation quiet
      e.stopImmediatePropagation()
      const link = linkOf(cursorIndex.value)
      deactivate()
      link?.click()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopImmediatePropagation()
      deactivate()
    }
  }

  useWindowKeydown(onKeydown)

  /** leave the zone when focus moves outside the sidebar nav */
  function onFocusOut(e: FocusEvent) {
    if (!active.value) return
    const next = e.relatedTarget as HTMLElement | null
    if (next && (e.currentTarget as HTMLElement).contains(next)) return
    deactivate()
  }

  return { items, active, cursorItem, cursorRoute, deactivate, onFocusOut }
}
