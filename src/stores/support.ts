import type { Ref } from 'vue'

export interface LoadFlags {
  loading: Ref<boolean>
  loaded: Ref<boolean>
  error: Ref<string | null>
}

/**
 * The stores' load-once shape: skip when already loaded or in flight, flip the
 * loading flag around `fn`, record thrown messages in `error`.
 */
export async function loadOnce(
  flags: LoadFlags,
  fn: () => Promise<void>,
  { resetError = false }: { resetError?: boolean } = {},
): Promise<void> {
  if (flags.loaded.value || flags.loading.value) return
  flags.loading.value = true
  if (resetError) flags.error.value = null
  try {
    await fn()
    flags.loaded.value = true
  } catch (e) {
    flags.error.value = (e as Error).message
  } finally {
    flags.loading.value = false
  }
}

/** Replace `target` with a freshly fetched detail, clearing it on failure. */
export async function loadDetailRef<T>(target: Ref<T | null>, fetcher: () => Promise<T>) {
  target.value = null
  try {
    target.value = await fetcher()
  } catch {
    target.value = null
  }
}

/** Group items by key, items whose key resolves to undefined are dropped */
export function groupBy<T>(items: T[], keyOf: (item: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (key === undefined) continue
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  return map
}
