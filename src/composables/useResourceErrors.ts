import { ref } from 'vue'
import { reportError } from '@/utils/errors'

export function useResourceErrors() {
  const detailErrors = ref<Map<string, string>>(new Map())
  const missingIds = ref<Set<string>>(new Set())

  function hasDetailError(id: string): boolean {
    return detailErrors.value.has(id)
  }

  function detailErrorMessage(id: string): string | undefined {
    return detailErrors.value.get(id)
  }

  function markDetailError(id: string, message: string): void {
    if (detailErrors.value.get(id) === message) return
    detailErrors.value = new Map(detailErrors.value).set(id, message)
  }

  function clearDetailError(id: string): void {
    if (!detailErrors.value.has(id)) return
    const m = new Map(detailErrors.value)
    m.delete(id)
    detailErrors.value = m
  }

  function isMissing(id: string): boolean {
    return missingIds.value.has(id)
  }

  function markMissing(id: string): void {
    if (missingIds.value.has(id)) return
    missingIds.value = new Set(missingIds.value).add(id)
  }

  return {
    detailErrors,
    missingIds,
    hasDetailError,
    detailErrorMessage,
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
  } catch (e) {
    errors.markDetailError(id, reportError('store.detail', e))
  }
}
