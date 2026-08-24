export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return (
    el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || !!el?.isContentEditable
  )
}

/**
 * Track a mouse drag: forwards mousemove events until mouseup, then calls
 * onUp. Returns a cancel function that removes the listeners without firing
 * onUp (e.g. for component unmount)
 */
export function trackMouseDrag(onMove: (ev: MouseEvent) => void, onUp: () => void): () => void {
  function up() {
    cancel()
    onUp()
  }
  function cancel() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', up)
  return cancel
}
