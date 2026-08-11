import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'

export function useWindowKeydown(handler: (e: KeyboardEvent) => void) {
  let listening = false
  const add = () => {
    if (listening) return
    window.addEventListener('keydown', handler)
    listening = true
  }
  const remove = () => {
    if (!listening) return
    window.removeEventListener('keydown', handler)
    listening = false
  }
  onMounted(add)
  onActivated(add)
  onDeactivated(remove)
  onUnmounted(remove)
}
