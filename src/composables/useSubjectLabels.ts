import { computed } from 'vue'
import { useNodesStore } from '@/stores/nodes'
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import { useApiStore } from '@/stores/apis'
import { useContextStore } from '@/stores/contexts'
import { isResourceNavigable } from '@/constants/resources'
import type { ResourceType } from '@/types/common'
import type { MetricSubject } from '@/types/metric'

export interface SubjectNavTarget {
  type: ResourceType
  id: string
}

export function useSubjectLabels() {
  const nodesStore = useNodesStore()
  const systemStore = useSystemStore()
  const componentStore = useComponentStore()
  const apiStore = useApiStore()
  const contextStore = useContextStore()

  const nodeNames = computed(() => new Map(nodesStore.nodes.map((n) => [n.nodeId, n.displayName])))
  const componentInstanceMap = computed(
    () => new Map(componentStore.componentInstances.map((i) => [i.componentInstanceId, i])),
  )
  const apiInstanceMap = computed(
    () => new Map(apiStore.apiInstances.map((i) => [i.apiInstanceId, i])),
  )

  function subjectName(s: MetricSubject | undefined): string | undefined {
    if (!s) return undefined
    switch (s.resourceType) {
      case 'Node':
        return nodeNames.value.get(s.resourceId)
      case 'System':
        return systemStore.systemMap.get(s.resourceId)?.displayName
      case 'SystemInstance':
        return systemStore.systemInstanceMap.get(s.resourceId)?.displayName
      case 'Component':
        return componentStore.componentMap.get(s.resourceId)?.displayName
      case 'ComponentInstance':
        return componentInstanceMap.value.get(s.resourceId)?.displayName
      case 'API':
        return apiStore.apiMap.get(s.resourceId)?.displayName
      case 'ApiInstance':
        return apiInstanceMap.value.get(s.resourceId)?.displayName
      case 'Context':
        return contextStore.contextMap.get(s.resourceId)?.displayName
      default:
        return undefined
    }
  }

  /** resolved name, or the raw id when the subject is unknown here */
  function subjectLabel(s: MetricSubject | undefined): string {
    if (!s) return ''
    return subjectName(s) ?? s.resourceId
  }

  function subjectNavTarget(s: MetricSubject | undefined): SubjectNavTarget | undefined {
    if (!s) return undefined
    if (isResourceNavigable(s.resourceType)) return { type: s.resourceType, id: s.resourceId }
    switch (s.resourceType) {
      case 'SystemInstance': {
        const parent = systemStore.systemInstanceMap.get(s.resourceId)?.system
        return parent ? { type: 'System', id: parent } : undefined
      }
      case 'ApiInstance': {
        const parent = apiInstanceMap.value.get(s.resourceId)?.api
        return parent ? { type: 'API', id: parent } : undefined
      }
      case 'ComponentInstance': {
        const parent = componentInstanceMap.value.get(s.resourceId)?.component
        return parent ? { type: 'Component', id: parent } : undefined
      }
      default:
        return undefined
    }
  }

  /** loads only the stores needed for the given subject types (all load-once) */
  async function ensureLoaded(types: Iterable<ResourceType>): Promise<void> {
    const loads: Promise<void>[] = []
    for (const t of new Set(types)) {
      switch (t) {
        case 'Node':
          loads.push(nodesStore.load())
          break
        case 'System':
          loads.push(systemStore.load())
          break
        case 'SystemInstance':
          loads.push(systemStore.load(), systemStore.loadSystemInstances())
          break
        case 'Component':
          loads.push(componentStore.load())
          break
        case 'ComponentInstance':
          loads.push(componentStore.load(), componentStore.loadComponentInstances())
          break
        case 'API':
          loads.push(apiStore.load())
          break
        case 'ApiInstance':
          loads.push(apiStore.load(), apiStore.loadApiInstances())
          break
        case 'Context':
          loads.push(contextStore.load())
          break
      }
    }
    await Promise.all(loads)
  }

  return { subjectName, subjectLabel, subjectNavTarget, ensureLoaded }
}
