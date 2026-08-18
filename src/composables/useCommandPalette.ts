import { useSingletonOverlay } from '@/composables/useSingletonOverlay'

const overlay = useSingletonOverlay()

export function useCommandPalette() {
  return overlay
}
