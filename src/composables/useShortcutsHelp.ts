import { ref } from 'vue'

// app-wide singleton: the overlay is mounted once (in BaseLayout) but any
// component, e.g. the topbar trigger. can open it through this shared state
const open = ref(false)

export function useShortcutsHelp() {
  return {
    open,
    toggle: () => (open.value = !open.value),
    close: () => (open.value = false),
  }
}
