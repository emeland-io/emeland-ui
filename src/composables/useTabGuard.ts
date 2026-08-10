import { useModalSurfaces } from '@/composables/useModalSurfaces'
import { useWindowKeydown } from '@/composables/useWindowKeydown'

export function useTabGuard() {
  const { anyModalOpen } = useModalSurfaces()

  useWindowKeydown((e) => {
    if (e.key !== 'Tab') return
    if (anyModalOpen.value) return
    e.preventDefault()
  })
}
