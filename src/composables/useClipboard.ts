import { ref } from 'vue'

/**
 * Clipboard composable with "copied" feedback
 *
 * Tracks which value was last copied so the UI can show a transient
 * confirmation next to the copied item
 *
 * Usage:
 *   const { copy, copiedId } = useClipboard()
 *   copy(finding.findingId, finding.findingId)
 *   // copiedId.value === finding.findingId for `timeout` ms
 */
export function useClipboard(timeout = 1500) {
  // The id of the most recently copied item (null when nothing is showing feedback)
  const copiedId = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(text: string, id?: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      copiedId.value = id ?? text
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        copiedId.value = null
        timer = null
      }, timeout)
      return true
    } catch {
      // Clipboard unavailable, fail silently
      return false
    }
  }

  function isCopied(id: string): boolean {
    return copiedId.value === id
  }

  return { copy, copiedId, isCopied }
}
