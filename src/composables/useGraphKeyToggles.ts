import { isEditableTarget } from '@/utils/dom'
import { useWindowKeydown } from '@/composables/useWindowKeydown'

/**
 * Maps single-letter keys to graph toggles — layer visibility
 * (LAYER_TOGGLE_KEYS) and view controls (GRAPH_TOGGLE_KEYS). `bindings` is keyed
 * by the lowercase `KeyboardEvent.key`
 */
export function useGraphKeyToggles(bindings: Record<string, (() => void) | undefined>) {
  function onKeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    if (isEditableTarget(e.target)) return
    const action = bindings[e.key.toLowerCase()]
    if (!action) return
    e.preventDefault()
    action()
  }

  useWindowKeydown(onKeydown)
}
