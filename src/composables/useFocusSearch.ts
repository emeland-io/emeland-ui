import { isEditableTarget } from '@/utils/dom'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { useModalSurfaces } from '@/composables/useModalSurfaces'

export const SEARCH_INPUT_SELECTOR = '[data-search-input]'
export const SEARCH_FOCUS_KEY = '/'

/**
 * `/` focuses the visible view's search input and selects its text
 */
export function useFocusSearch() {
  const { anyModalOpen } = useModalSurfaces()

  function onKeydown(e: KeyboardEvent) {
    if (
      e.key === 'Escape' &&
      e.target instanceof HTMLElement &&
      e.target.matches(SEARCH_INPUT_SELECTOR)
    ) {
      e.preventDefault()
      e.stopImmediatePropagation()
      e.target.blur()
      return
    }
    if (e.key !== SEARCH_FOCUS_KEY) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (isEditableTarget(e.target)) return
    if (anyModalOpen.value) return
    const input = document.querySelector<HTMLElement>(SEARCH_INPUT_SELECTOR)
    if (!input) return
    e.preventDefault()
    e.stopImmediatePropagation()
    input.focus()
    if (input instanceof HTMLInputElement) input.select()
  }
  useWindowKeydown(onKeydown)
}
