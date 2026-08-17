import { computed } from 'vue'

export interface DrawerNavOptions {
  /** ordered ids the drawer can step through */
  navIds: () => string[] | undefined
  /** id currently shown */
  current: () => string
  onNavigate: (id: string) => void
  /** stepping past either end of the list */
  onExit: (step: number) => void
}

/**
 * Prev/next stepping through a drawer's sibling list: resolves the current
 * position and emits navigate within bounds or nav-exit past the ends.
 */
export function useDrawerNav(options: DrawerNavOptions) {
  const navIndex = computed(() => options.navIds()?.indexOf(options.current()) ?? -1)

  function step(direction: -1 | 1) {
    const ids = options.navIds()
    if (!ids || navIndex.value < 0) return
    const next = ids[navIndex.value + direction]
    if (next !== undefined) options.onNavigate(next)
    else options.onExit(direction)
  }

  return { navIndex, step }
}
