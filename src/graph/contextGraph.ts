import type { Context } from '@/types/context'
import type { SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge, NodeInstanceRef } from '@/types/graph'
import { layoutFramedColumns, type LayoutAnchor } from './layout'
import {
  containsEdges,
  findingData,
  hierarchyDepth,
  instanceNameRefs,
  orderParentsFirst,
} from './helpers'

export interface ContextGraphInput {
  contexts: Context[]
  typeName: (context: Context) => string
  instanceCountOf?: (contextId: string) => number
  findingCountOf?: (contextId: string) => number
  findingKindsOf?: (contextId: string) => string[]
  instancesIn?: (contextId: string) => SystemInstance[]
  instanceUnresolved?: (instance: SystemInstance) => boolean
}

export function buildContextGraph({
  contexts,
  typeName,
  instanceCountOf,
  findingCountOf,
  findingKindsOf,
  instancesIn,
  instanceUnresolved,
}: ContextGraphInput): GraphModel {
  const all = contexts ?? []

  const depthOf = hierarchyDepth(
    all,
    (c) => c.contextId,
    (c) => c.parentId,
  )

  // Parents first, each followed by its children
  const ordered = orderParentsFirst(
    all,
    (c) => c.contextId,
    (c) => c.parentId,
  )

  const instanceNamesOf = new Map<string, NodeInstanceRef[]>()
  if (instancesIn) {
    for (const context of ordered) {
      const names = instanceNameRefs(instancesIn(context.contextId), instanceUnresolved)?.sort(
        (a, b) => a.name.localeCompare(b.name),
      )
      if (names?.length) instanceNamesOf.set(context.contextId, names)
    }
  }

  const anchors: LayoutAnchor[] = ordered.map((context) => ({
    id: context.contextId,
    kind: 'context-node',
    rowKey: context.contextId,
    depth: depthOf(context),
    selectable: true,
    data: {
      label: context.displayName,
      description: context.description || undefined,
      type: typeName(context) || undefined,
      instances: instanceCountOf?.(context.contextId) || undefined,
      instanceNames: instanceNamesOf.get(context.contextId),
      ...findingData(context.contextId, findingCountOf, findingKindsOf),
    },
  }))

  const edges: GraphEdge[] = containsEdges(
    all,
    (c) => c.contextId,
    (c) => c.parentId,
  )

  return layoutFramedColumns({ frames: [], members: [], anchors, edges })
}
