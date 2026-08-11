import { toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { isEditableTarget } from '@/utils/dom'

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
    const index = ids.indexOf(cursor.value)
    if (index < 0) {
      cursor.value = e.key === 'ArrowRight' ? ids[0] : ids[ids.length - 1]
      return
    }
    const next = e.key === 'ArrowRight' ? index + 1 : index - 1
    if (next < 0 || next >= ids.length) return
    cursor.value = ids[next]
  }

  useWindowKeydown(onKeydown)
}
