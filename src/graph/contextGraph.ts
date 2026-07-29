import type { Context } from '@/types/context'
import type { SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import {
  layoutFramedColumns,
  type LayoutAnchor,
  type LayoutMember,
  type LayoutFrame,
} from './layout'

export interface ContextGraphInput {
  contexts: Context[]
  typeName: (context: Context) => string
  instanceCountOf?: (contextId: string) => number
  findingCountOf?: (contextId: string) => number
  findingKindsOf?: (contextId: string) => string[]
  instancesIn?: (contextId: string) => SystemInstance[]
  systemName?: (systemId: string | undefined) => string | undefined
}

export function buildContextGraph(input: ContextGraphInput): GraphModel {
  return buildContextInstanceGraph({
    ...input,
    instancesIn: input.instancesIn ?? (() => []),
    systemName: input.systemName ?? (() => undefined),
    showInstances: false,
  })
}

export interface ContextInstanceGraphInput extends ContextGraphInput {
  instancesIn: (contextId: string) => SystemInstance[]
  systemName: (systemId: string | undefined) => string | undefined
  showInstances?: boolean
}

const NO_SYSTEM = 'no-system'

export function buildContextInstanceGraph({
  contexts,
  typeName,
  instanceCountOf,
  findingCountOf,
  findingKindsOf,
  instancesIn,
  systemName,
  showInstances = true,
}: ContextInstanceGraphInput): GraphModel {
  const all = contexts ?? []
  const byId = new Map(all.map((c) => [c.contextId, c]))

  const depthOf = (context: Context): number => {
    let depth = 0
    let current = context.parentId
    const seen = new Set<string>([context.contextId])
    while (current && byId.has(current) && !seen.has(current)) {
      seen.add(current)
      depth++
      current = byId.get(current)?.parentId
    }
    return depth
  }

  // Parents first, each followed by its children
  const childrenOf = new Map<string, Context[]>()
  const roots: Context[] = []
  for (const c of all) {
    if (c.parentId && byId.has(c.parentId)) {
      childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c])
    } else {
      roots.push(c)
    }
  }
  const ordered: Context[] = []
  const visit = (c: Context) => {
    if (ordered.includes(c)) return
    ordered.push(c)
    for (const child of childrenOf.get(c.contextId) ?? []) visit(child)
  }
  for (const r of roots) visit(r)

  const frameOf = (inst: SystemInstance) => inst.system ?? NO_SYSTEM
  const frameLabel = (inst: SystemInstance) =>
    inst.system ? (systemName(inst.system) ?? inst.system) : 'No system'

  // Sorted instances per context
  const instanceNamesOf = new Map<string, string[]>()
  const sortedInstancesOf = new Map<string, SystemInstance[]>()
  for (const context of ordered) {
    const instances = [...instancesIn(context.contextId)].sort(
      (a, b) =>
        frameLabel(a).localeCompare(frameLabel(b)) || a.displayName.localeCompare(b.displayName),
    )
    sortedInstancesOf.set(context.contextId, instances)
    if (instances.length) {
      instanceNamesOf.set(
        context.contextId,
        instances.map((i) => i.displayName),
      )
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
      findings: findingCountOf?.(context.contextId) || undefined,
      findingKinds: findingKindsOf?.(context.contextId),
    },
  }))

  const frameLabels = new Map<string, string>()
  const members: LayoutMember[] = []
  const edges: GraphEdge[] = []

  if (showInstances) {
    for (const context of ordered) {
      for (const inst of sortedInstancesOf.get(context.contextId) ?? []) {
        const frameId = frameOf(inst)
        if (!frameLabels.has(frameId)) frameLabels.set(frameId, frameLabel(inst))
        members.push({
          id: inst.systemInstanceId,
          kind: 'instance',
          frameId,
          rowKey: context.contextId,
          data: {
            label: inst.displayName,
            parent: context.contextId,
            context: context.displayName,
            system: inst.system ? systemName(inst.system) : undefined,
            type: 'SystemInstance',
          },
        })
        edges.push({
          id: `${context.contextId}->${inst.systemInstanceId}`,
          source: context.contextId,
          target: inst.systemInstanceId,
          kind: 'contains',
        })
      }
    }
  }

  for (const context of all) {
    if (!context.parentId || !byId.has(context.parentId)) continue
    edges.push({
      id: `sub:${context.parentId}:${context.contextId}`,
      source: context.parentId,
      target: context.contextId,
      kind: 'contains',
    })
  }

  const frames: LayoutFrame[] = [...frameLabels]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, label], i) => ({ id, kind: 'context' as const, data: { label }, order: i }))

  return layoutFramedColumns({ frames, members, anchors, edges })
}
