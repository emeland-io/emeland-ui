import { computed, ref } from 'vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useShortcutsHelp } from '@/composables/useShortcutsHelp'

const drawerOpenCount = ref(0)

export function useModalSurfaces() {
  const { open: paletteOpen } = useCommandPalette()
  const { open: helpOpen } = useShortcutsHelp()

  const anyModalOpen = computed(
    () => drawerOpenCount.value > 0 || paletteOpen.value || helpOpen.value,
  )

  return {
    drawerOpenCount,
    paletteOpen,
    helpOpen,
    anyModalOpen,
  }
}
