import { toValue, type MaybeRefOrGetter } from 'vue'
import { isEditableTarget } from '@/utils/dom'
import { stepIndex } from '@/utils/stepIndex'
import { useWindowKeydown } from '@/composables/useWindowKeydown'

/** scrolls a list row (marked with data-row-id) into view */
export function scrollRowIntoView(id: string) {
  // dataset lookup instead of CSS.escape (not available everywhere, e.g. jsdom)
  const el = [...document.querySelectorAll<HTMLElement>('[data-row-id]')].find(
    (e) => e.dataset.rowId === id,
  )
  el?.scrollIntoView({ block: 'nearest' })
}

/**
 * ArrowUp/ArrowDown steps a list selection through the visible rows (in
 * display order)
 */
export function useListKeyboardNav(
  rowIds: MaybeRefOrGetter<string[]>,
  selectedId: MaybeRefOrGetter<string>,
  select: (id: string) => void,
  blocked: MaybeRefOrGetter<boolean>,
  onNextOverflow?: () => void,
) {
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    if (toValue(blocked)) return
    if (isEditableTarget(e.target)) return

    const ids = toValue(rowIds)
    const dir = e.key === 'ArrowUp' ? -1 : 1
    e.preventDefault()
    e.stopImmediatePropagation()
    const next = stepIndex(ids, toValue(selectedId), dir)
    if (next < 0) {
      // stepping down past the last row (or in an empty list) moves focus onward
      if (dir === 1) onNextOverflow?.()
      return
    }

    const id = ids[next]
    select(id)
    scrollRowIntoView(id)
  }

  useWindowKeydown(onKeydown)
}
