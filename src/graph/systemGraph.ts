import type { System, SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, type DagNode } from './layoutDag'

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
  const present = new Set(allSystems.map((s) => s.systemId))

  const nodes: DagNode[] = allSystems.map((system) => {
    const instances = instancesOf?.(system.systemId) ?? []
    return {
      id: system.systemId,
      kind: 'system',
      data: {
        label: system.displayName,
        abstract: system.abstract,
        description: system.description || undefined,
        version: system.version?.version || undefined,
        findings: findingCountOf?.(system.systemId) || undefined,
        findingKinds: findingKindsOf?.(system.systemId),
        instanceNames: instances.length
          ? instances.map((i) => ({
              name: i.displayName,
              unresolved: instanceUnresolved?.(i) || undefined,
            }))
          : undefined,
      },
    }
  })

  const edges: GraphEdge[] = []
  for (const system of allSystems) {
    if (!system.parent || !present.has(system.parent)) continue
    edges.push({
      id: `sub:${system.parent}:${system.systemId}`,
      source: system.parent,
      target: system.systemId,
      kind: 'contains',
    })
  }

  return layoutDag({ nodes, edges, direction: 'LR' })
}
