export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return (
    el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || !!el?.isContentEditable
  )
}
