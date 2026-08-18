import { toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { isEditableTarget } from '@/utils/dom'
import { stepIndex } from '@/utils/stepIndex'

export function useInstanceCursorNav(
  instanceIds: MaybeRefOrGetter<string[]>,
  cursor: Ref<string>,
  open: (id: string) => void,
  blocked: MaybeRefOrGetter<boolean>,
) {
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Enter' && e.key !== 'Escape')
      return
    if (isEditableTarget(e.target)) return

    if (e.key === 'Escape') {
      if (!cursor.value || toValue(blocked)) return
      e.preventDefault()
      e.stopImmediatePropagation()
      cursor.value = ''
      return
    }
    if (toValue(blocked)) return

    if (e.key === 'Enter') {
      if (e.shiftKey || !cursor.value) return
      e.preventDefault()
      e.stopImmediatePropagation()
      open(cursor.value)
      return
    }

    const ids = toValue(instanceIds)
    if (ids.length === 0) return
    e.preventDefault()
    e.stopImmediatePropagation()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const next = stepIndex(ids, cursor.value, dir)
    if (next < 0) return
    cursor.value = ids[next]
  }

  useWindowKeydown(onKeydown)
}
