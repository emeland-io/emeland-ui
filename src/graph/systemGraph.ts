import type { System } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, type DagNode } from './layoutDag'

export interface SystemGraphInput {
  systems: System[]
  findingCountOf?: (systemId: string) => number
}

export function buildSystemGraph({ systems, findingCountOf }: SystemGraphInput): GraphModel {
  const allSystems = systems ?? []
  const present = new Set(allSystems.map((s) => s.systemId))

  const nodes: DagNode[] = allSystems.map((system) => ({
    id: system.systemId,
    kind: 'system',
    data: {
      label: system.displayName,
      abstract: system.abstract,
      version: system.version?.version || undefined,
      findings: findingCountOf?.(system.systemId) || undefined,
    },
  }))

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
