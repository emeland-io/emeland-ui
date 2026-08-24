import { useSingletonOverlay } from '@/composables/useSingletonOverlay'

// app-wide singleton: the overlay is mounted once (in BaseLayout) but any
// component, e.g. the topbar trigger, can open it through this shared state
const overlay = useSingletonOverlay()

export function useShortcutsHelp() {
  return overlay
}
