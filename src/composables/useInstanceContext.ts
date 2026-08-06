import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import type { ComponentInstance } from '@/types/component'

export interface ResolvedContext {
  id?: string
  name?: string
  unresolved: boolean
}

export function useInstanceContext() {
  const systemStore = useSystemStore()
  const contextStore = useContextStore()

  function contextIdForSystemInstance(systemInstanceId: string | undefined): string | undefined {
    if (!systemInstanceId) return undefined
    return systemStore.systemInstanceMap.get(systemInstanceId)?.context
  }

  function contextForInstance(inst: ComponentInstance): ResolvedContext {
    const id = contextIdForSystemInstance(inst.systemInstance)
    if (!id) return { unresolved: false }
    const ctx = contextStore.contextMap.get(id)
    if (!ctx) return { id, unresolved: true }
    return { id, name: ctx.displayName, unresolved: false }
  }

  return { contextForInstance, contextIdForSystemInstance }
}
