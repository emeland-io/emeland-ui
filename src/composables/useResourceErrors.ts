import { ref } from 'vue'

export function useResourceErrors() {
  const detailErrorIds = ref<Set<string>>(new Set())
  const missingIds = ref<Set<string>>(new Set())

  function hasDetailError(id: string): boolean {
    return detailErrorIds.value.has(id)
  }

  function markDetailError(id: string): void {
    if (detailErrorIds.value.has(id)) return
    detailErrorIds.value = new Set(detailErrorIds.value).add(id)
  }

  function clearDetailError(id: string): void {
    if (!detailErrorIds.value.has(id)) return
    const s = new Set(detailErrorIds.value)
    s.delete(id)
    detailErrorIds.value = s
  }

  function isMissing(id: string): boolean {
    return missingIds.value.has(id)
  }

  function markMissing(id: string): void {
    if (missingIds.value.has(id)) return
    missingIds.value = new Set(missingIds.value).add(id)
  }

  return {
    detailErrorIds,
    missingIds,
    hasDetailError,
    markDetailError,
    clearDetailError,
    isMissing,
    markMissing,
  }
}

export async function loadDetailInto<T>(
  id: string,
  fetcher: (id: string) => Promise<T>,
  apply: (full: T) => void,
  errors: Pick<ReturnType<typeof useResourceErrors>, 'markDetailError' | 'clearDetailError'>,
): Promise<void> {
  try {
    apply(await fetcher(id))
    errors.clearDetailError(id)
  } catch {
    errors.markDetailError(id)
  }
}
