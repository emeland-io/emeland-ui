import type { System, SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, type DagNode } from './layoutDag'
import { containsEdges, findingData, instanceNameRefs } from './helpers'

export interface SystemGraphInput {
  systems: System[]
  findingCountOf?: (systemId: string) => number
  findingKindsOf?: (systemId: string) => string[]
  instancesOf?: (systemId: string) => SystemInstance[]
  instanceUnresolved?: (instance: SystemInstance) => boolean
}

export function buildSystemGraph({
  systems,
  findingCountOf,
  findingKindsOf,
  instancesOf,
  instanceUnresolved,
}: SystemGraphInput): GraphModel {
  const allSystems = systems ?? []

  const nodes: DagNode[] = allSystems.map((system) => ({
    id: system.systemId,
    kind: 'system',
    data: {
      label: system.displayName,
      abstract: system.abstract,
      description: system.description || undefined,
      version: system.version?.version || undefined,
      ...findingData(system.systemId, findingCountOf, findingKindsOf),
      instanceNames: instanceNameRefs(instancesOf?.(system.systemId) ?? [], instanceUnresolved),
    },
  }))

  const edges: GraphEdge[] = containsEdges(
    allSystems,
    (s) => s.systemId,
    (s) => s.parent,
  )

  return layoutDag({ nodes, edges, direction: 'LR' })
}
