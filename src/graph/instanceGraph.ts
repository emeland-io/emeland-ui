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
  findingKindsOf?: (systemId: string) => string[]
  unmappedInstances?: SystemInstance[]
}

const NO_CONTEXT = 'no-context'
const UNMAPPED_ROW = 'unmapped'

export function buildInstanceGraph({
  systems,
  instancesOf,
  contextName,
  findingCountOf,
  findingKindsOf,
  unmappedInstances,
}: InstanceGraphInput): GraphModel {
  const allSystems = systems ?? []
  const unmapped = unmappedInstances ?? []
  const withInstances = allSystems
    .map((system) => ({ system, instances: instancesOf(system.systemId) }))
    .filter((g) => g.instances.length > 0)

  const ctxLabel = (inst: SystemInstance) =>
    inst.context ? (contextName(inst.context) ?? inst.context) : 'No context'
  const frameOf = (inst: SystemInstance) => inst.context ?? NO_CONTEXT

  const byId = new Map(allSystems.map((s) => [s.systemId, s]))
  const isParent = new Set(
    allSystems.filter((s) => s.parent && byId.has(s.parent)).map((s) => s.parent as string),
  )

  const depthOf = (system: System): number => {
    let depth = 0
    let current = system.parent
    const seen = new Set<string>([system.systemId])
    while (current && byId.has(current) && !seen.has(current)) {
      seen.add(current)
      depth++
      current = byId.get(current)?.parent
    }
    if (depth === 0 && !isParent.has(system.systemId)) return 1
    return depth
  }

  const childrenOf = new Map<string, System[]>()
  const roots: System[] = []
  for (const system of allSystems) {
    if (system.parent && byId.has(system.parent)) {
      childrenOf.set(system.parent, [...(childrenOf.get(system.parent) ?? []), system])
    } else {
      roots.push(system)
    }
  }
  const ordered: System[] = []
  const visit = (system: System) => {
    if (ordered.includes(system)) return
    ordered.push(system)
    for (const child of childrenOf.get(system.systemId) ?? []) visit(child)
  }
  for (const r of roots) visit(r)

  const anchors: LayoutAnchor[] = ordered.map((system) => ({
    id: system.systemId,
    kind: 'system',
    rowKey: system.systemId,
    depth: depthOf(system),
    selectable: false,
    data: {
      label: system.displayName,
      abstract: system.abstract,
      description: system.description || undefined,
      version: system.version?.version || undefined,
      findings: findingCountOf?.(system.systemId) || undefined,
      findingKinds: findingKindsOf?.(system.systemId),
    },
  }))

  const frameLabels = new Map<string, string>()
  for (const { instances } of withInstances) {
    for (const inst of instances) {
      const id = frameOf(inst)
      if (!frameLabels.has(id)) frameLabels.set(id, ctxLabel(inst))
    }
  }

  for (const inst of unmapped) {
    const id = frameOf(inst)
    if (!frameLabels.has(id)) frameLabels.set(id, ctxLabel(inst))
  }

  const frames: LayoutFrame[] = [...frameLabels]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, label], order) => ({ id, kind: 'context', order, data: { label } }))

  const members: LayoutMember[] = []
  const edges: GraphEdge[] = []

  const present = new Set(allSystems.map((s) => s.systemId))
  for (const system of allSystems) {
    if (!system.parent || !present.has(system.parent)) continue
    edges.push({
      id: `sub:${system.parent}:${system.systemId}`,
      source: system.parent,
      target: system.systemId,
      kind: 'contains',
    })
  }
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
        data: {
          label: inst.displayName,
          parent: system.systemId,
          system: system.displayName,
          context: ctxLabel(inst),
          type: 'SystemInstance',
        },
      })
      edges.push({
        id: `${system.systemId}->${inst.systemInstanceId}`,
        source: system.systemId,
        target: inst.systemInstanceId,
        kind: 'contains',
      })
    }
  }

  const unmappedOrdered = [...unmapped].sort(
    (a, b) => ctxLabel(a).localeCompare(ctxLabel(b)) || a.displayName.localeCompare(b.displayName),
  )
  for (const inst of unmappedOrdered) {
    members.push({
      id: inst.systemInstanceId,
      kind: 'instance',
      frameId: frameOf(inst),
      rowKey: UNMAPPED_ROW,
      data: {
        label: inst.displayName,
        context: ctxLabel(inst),
        type: 'SystemInstance',
        unmapped: true,
        unresolved: inst.system ? true : undefined,
      },
    })
  }

  return layoutFramedColumns({ anchors, frames, members, edges })
}
