import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'

export interface ResolvedContext {
  id?: string
  name?: string
  unresolved: boolean
}

// any instance kind that references its context indirectly via a system instance
export interface SystemInstanceBound {
  systemInstance?: string
}

export function useInstanceContext() {
  const systemStore = useSystemStore()
  const contextStore = useContextStore()

  function contextIdForSystemInstance(systemInstanceId: string | undefined): string | undefined {
    if (!systemInstanceId) return undefined
    return systemStore.systemInstanceMap.get(systemInstanceId)?.context
  }

  function contextForInstance(inst: SystemInstanceBound): ResolvedContext {
    const id = contextIdForSystemInstance(inst.systemInstance)
    if (!id) return { unresolved: false }
    const ctx = contextStore.contextMap.get(id)
    if (!ctx) return { id, unresolved: true }
    return { id, name: ctx.displayName, unresolved: false }
  }

  return { contextForInstance, contextIdForSystemInstance }
}
