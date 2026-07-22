import type { System, SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import {
  layoutFramedColumns,
  type LayoutAnchor,
  type LayoutMember,
  type LayoutFrame,
} from './layout'

export interface InstanceGraphInput {
  systems: System[]
  instancesOf: (systemId: string) => SystemInstance[]
  contextName: (contextId: string | undefined) => string | undefined
  findingCountOf?: (systemId: string) => number
}

const NO_CONTEXT = 'no-context'

export function buildInstanceGraph({
  systems,
  instancesOf,
  contextName,
  findingCountOf,
}: InstanceGraphInput): GraphModel {
  // Robust against a not-yet-loaded list: a missing systems array yields an
  // empty graph rather than throwing.
  const allSystems = systems ?? []
  const withInstances = allSystems
    .map((system) => ({ system, instances: instancesOf(system.systemId) }))
    .filter((g) => g.instances.length > 0)
  const hasInstances = new Set(withInstances.map((g) => g.system.systemId))

  const ctxLabel = (inst: SystemInstance) =>
    inst.context ? (contextName(inst.context) ?? inst.context) : 'No context'
  const frameOf = (inst: SystemInstance) => inst.context ?? NO_CONTEXT

  const anchors: LayoutAnchor[] = allSystems
    .filter((system) => hasInstances.has(system.systemId) || system.abstract)
    .map((system) => ({
      id: system.systemId,
      kind: 'system',
      rowKey: system.systemId,
      selectable: false,
      data: {
        label: system.displayName,
        abstract: system.abstract,
        version: system.version?.version || undefined,
        findings: findingCountOf?.(system.systemId) || undefined,
      },
    }))

  const frameLabels = new Map<string, string>()
  for (const { instances } of withInstances) {
    for (const inst of instances) {
      const id = frameOf(inst)
      if (!frameLabels.has(id)) frameLabels.set(id, ctxLabel(inst))
    }
  }
  const frames: LayoutFrame[] = [...frameLabels]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, label], order) => ({ id, kind: 'context', order, data: { label } }))

  const members: LayoutMember[] = []
  const edges: GraphEdge[] = []
  for (const { system, instances } of withInstances) {
    const ordered = [...instances].sort(
      (a, b) =>
        ctxLabel(a).localeCompare(ctxLabel(b)) || a.displayName.localeCompare(b.displayName),
    )
    for (const inst of ordered) {
      members.push({
        id: inst.systemInstanceId,
        kind: 'instance',
        frameId: frameOf(inst),
        rowKey: system.systemId,
        data: { label: inst.displayName },
      })
      edges.push({
        id: `${system.systemId}->${inst.systemInstanceId}`,
        source: system.systemId,
        target: inst.systemInstanceId,
        kind: 'contains',
      })
    }
  }

  return layoutFramedColumns({ anchors, frames, members, edges })
}
