import { useContextStore } from '@/stores/contexts'

/** Display name and type label lookups for context ids (detail panes, drawers). */
export function useContextLabels() {
  const contextStore = useContextStore()

  function contextName(id: string | undefined): string | undefined {
    if (!id) return undefined
    return contextStore.contextMap.get(id)?.displayName
  }

  function contextType(id: string | undefined): string | undefined {
    if (!id) return undefined
    const ctx = contextStore.contextMap.get(id)
    if (!ctx) return undefined
    const type = contextStore.getTypeName(ctx)
    return type === 'Unknown' ? undefined : type
  }

  return { contextName, contextType }
}
