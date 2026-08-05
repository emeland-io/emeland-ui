import type { Context } from '@/types/context'
import type { SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutFramedColumns, type LayoutAnchor } from './layout'

export interface ContextGraphInput {
  contexts: Context[]
  typeName: (context: Context) => string
  instanceCountOf?: (contextId: string) => number
  findingCountOf?: (contextId: string) => number
  findingKindsOf?: (contextId: string) => string[]
  instancesIn?: (contextId: string) => SystemInstance[]
}

export function buildContextGraph({
  contexts,
  typeName,
  instanceCountOf,
  findingCountOf,
  findingKindsOf,
  instancesIn,
}: ContextGraphInput): GraphModel {
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

  const instanceNamesOf = new Map<string, string[]>()
  if (instancesIn) {
    for (const context of ordered) {
      const names = instancesIn(context.contextId)
        .map((i) => i.displayName)
        .sort((a, b) => a.localeCompare(b))
      if (names.length) instanceNamesOf.set(context.contextId, names)
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

  const edges: GraphEdge[] = []
  for (const context of all) {
    if (!context.parentId || !byId.has(context.parentId)) continue
    edges.push({
      id: `sub:${context.parentId}:${context.contextId}`,
      source: context.parentId,
      target: context.contextId,
      kind: 'contains',
    })
  }

  return layoutFramedColumns({ frames: [], members: [], anchors, edges })
}
