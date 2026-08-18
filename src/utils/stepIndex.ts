/**
 * Index of the next item when stepping a selection/cursor with arrow keys
 *
 * When the current id is not in the list, forward starts at the first item and
 * backward at the last. Returns -1 when the step would leave the list (or the
 * list is empty) — the caller decides whether that is a no-op or an overflow
 */
export function stepIndex(ids: readonly string[], currentId: string, dir: 1 | -1): number {
  if (ids.length === 0) return -1
  const index = ids.indexOf(currentId)
  if (index < 0) return dir === 1 ? 0 : ids.length - 1
  const next = index + dir
  return next < 0 || next >= ids.length ? -1 : next
}
