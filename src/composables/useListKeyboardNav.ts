import { toValue, type MaybeRefOrGetter } from 'vue'
import { isEditableTarget } from '@/utils/dom'
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
    const index = ids.indexOf(toValue(selectedId))
    const next =
      index < 0
        ? e.key === 'ArrowUp'
          ? ids.length - 1
          : 0
        : e.key === 'ArrowUp'
          ? index - 1
          : index + 1
    e.preventDefault()
    e.stopImmediatePropagation()
    if (next >= ids.length && e.key === 'ArrowDown') {
      onNextOverflow?.()
      return
    }
    if (next < 0 || next >= ids.length) return

    const id = ids[next]
    select(id)
    scrollRowIntoView(id)
  }

  useWindowKeydown(onKeydown)
}
