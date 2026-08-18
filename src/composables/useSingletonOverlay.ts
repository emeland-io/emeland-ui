import { ref } from 'vue'

export function useSingletonOverlay() {
  const open = ref(false)
  return {
    open,
    toggle: () => (open.value = !open.value),
    close: () => (open.value = false),
  }
}
